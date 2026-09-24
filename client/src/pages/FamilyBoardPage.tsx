import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleAlert, LayoutDashboard, Pencil, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { api, type Note } from '@/lib/api';
import { useConfig } from '@/lib/config';

// Card themes, applied to the configured note boards in order.
const BOARD_THEMES = [
  {
    emoji: '💗',
    cardBg: 'bg-[#FDF4F8]',
    borderColor: 'border-[#F2C4D8]',
    headerBg: 'bg-[#FAE6F0]',
    headerText: 'text-[#C0587A]',
    btnBg: 'bg-[#F2C4D8] hover:bg-[#E8A8C4] text-[#9B3A5E]',
    saveBg: 'bg-[#C0587A] hover:bg-[#A84068] text-white',
    dotColor: 'bg-[#F2C4D8]',
    shadowColor: 'shadow-pink-100',
  },
  {
    emoji: '💙',
    cardBg: 'bg-[#F0F7FF]',
    borderColor: 'border-[#B8D4F0]',
    headerBg: 'bg-[#E0EEFA]',
    headerText: 'text-[#2E6BB0]',
    btnBg: 'bg-[#B8D4F0] hover:bg-[#90B8E0] text-[#1E5A9E]',
    saveBg: 'bg-[#2E6BB0] hover:bg-[#235890] text-white',
    dotColor: 'bg-[#B8D4F0]',
    shadowColor: 'shadow-blue-100',
  },
];

type Theme = (typeof BOARD_THEMES)[number];

interface NoteCardProps {
  title: string;
  theme: Theme;
  note: Note | null;
  isSaving: boolean;
  onSave: (text: string) => Promise<void>;
}

function NoteCard({ title, theme, note, isSaving, onSave }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEditing = () => {
    setDraft(note?.note || '');
    setIsEditing(true);
  };

  const save = async () => {
    if (!draft.trim()) return;
    await onSave(draft.trim());
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col rounded-3xl border-2 ${theme.borderColor} ${theme.cardBg} shadow-xl ${theme.shadowColor} overflow-hidden`}
      style={{ minHeight: 420 }}
    >
      <div className={`flex items-center gap-3 px-7 py-5 ${theme.headerBg}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`w-2.5 h-2.5 rounded-full ${theme.dotColor} opacity-80`} />
          ))}
        </div>
        <h2 className={`flex-1 text-center text-xl font-bold tracking-wide ${theme.headerText}`}>
          {theme.emoji} {title}
        </h2>
      </div>

      <div className="flex flex-col flex-1 px-8 py-7 gap-5">
        {isEditing ? (
          <>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={8}
              placeholder="Write your note here…"
              className={`flex-1 w-full resize-none rounded-xl border ${theme.borderColor} ${theme.cardBg} bg-white/60 px-4 py-3 text-sm text-foreground/90 font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 leading-relaxed`}
              style={{ minHeight: 180 }}
            />
            <div className="flex gap-3">
              <button
                onClick={save}
                disabled={isSaving || !draft.trim()}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${theme.saveBg}`}
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${theme.btnBg}`}
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1">
              {note?.note ? (
                <p className="text-foreground/80 text-[1.05rem] leading-relaxed whitespace-pre-wrap font-medium">{note.note}</p>
              ) : (
                <p className="text-muted-foreground italic text-sm">No note yet. Tap "Edit Note" to write one.</p>
              )}
            </div>
            {note?.timestamp && (
              <p className="text-xs text-muted-foreground/60 font-medium">Last updated: {note.timestamp}</p>
            )}
            <button
              onClick={startEditing}
              className={`self-start flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${theme.btnBg}`}
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Note
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function FamilyBoardPage() {
  const { noteBoards } = useConfig();
  const [notes, setNotes] = useState<Record<string, Note | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const rows = await api.notes();
      // Latest row per board owner wins, matching how the sheet may accumulate rows.
      const latest: Record<string, Note | null> = {};
      for (const row of rows) {
        const owner = String(row.user || '').trim().toLowerCase();
        if (!noteBoards.some((b) => b.key === owner)) continue;
        if (!latest[owner] || String(row.timestamp) > String(latest[owner]!.timestamp)) latest[owner] = row;
      }
      setNotes(latest);
    } catch (err) {
      console.error('FamilyBoard fetch error:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [noteBoards]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNote = async (owner: string, text: string) => {
    setSaving((s) => ({ ...s, [owner]: true }));
    setSaveError(null);
    const payload = { user: owner, note: text, timestamp: new Date().toLocaleString('en-US') };
    try {
      const existing = notes[owner];
      if (existing?.id) await api.updateNote(existing.id, payload);
      else await api.createNote(payload);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving((s) => ({ ...s, [owner]: false }));
    }
  };

  const ownerNames = noteBoards.map((b) => capitalize(b.key)).join(' & ');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <PageHeader
          icon={LayoutDashboard}
          gradientClassName="from-primary/8 via-fuchsia-500/5 to-blue-500/6"
          title="🏠 Family Board"
          subtitle={`A shared space for ${ownerNames} — leave notes, reminders, or anything on your mind.`}
        />

        {(loadError || saveError) && !isLoading && (
          <div className="flex items-start gap-3 px-5 py-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <CircleAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                {saveError ? `Could not save the note: ${saveError}` : 'Could not connect to the Notes database.'}
              </p>
              <p className="text-xs mt-1 leading-relaxed">
                Make sure your Google Sheet "Notes" tab has the column headers{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">User</code>,{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">Note</code>,{' '}
                <code className="font-mono bg-amber-100 px-1 rounded">Timestamp</code>.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isLoading
            ? noteBoards.map((b) => (
                <div
                  key={b.key}
                  className="rounded-3xl border-2 border-slate-200 bg-slate-50 animate-pulse"
                  style={{ minHeight: 420 }}
                >
                  <div className="h-16 bg-slate-200 rounded-t-3xl" />
                  <div className="p-8 space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))
            : noteBoards.map((b, i) => (
                <NoteCard
                  key={b.key}
                  title={b.title}
                  theme={BOARD_THEMES[i % BOARD_THEMES.length]}
                  note={notes[b.key] ?? null}
                  isSaving={!!saving[b.key]}
                  onSave={(text) => saveNote(b.key, text)}
                />
              ))}
        </div>
      </div>
    </div>
  );
}
