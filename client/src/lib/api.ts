// Typed client for the Express API. Record shapes mirror the Google Sheet columns
// (headers converted to camelCase); `id` is the sheet row number.

export interface Expense {
  id: number;
  timestamp: string;
  totalAmount: number | string;
  shop: string;
  type?: string;
  comments?: string;
}

export interface Reminder {
  id: number;
  timestamp: string;
  title: string;
  date: string;
  time: string;
  sourceKey?: string;
  eventId?: string;
}

export interface HealthLog {
  id: number;
  timestamp: string;
  name: string;
  weight: string;
}

export interface Note {
  id: number;
  user: string;
  note: string;
  timestamp: string;
}

export interface AppConfig {
  familyMembers: string[];
  noteBoards: { key: string; title: string }[];
  weather: { latitude: number; longitude: number; label: string };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

type NoteInput = Omit<Note, 'id'>;

export const api = {
  config: () => request<AppConfig>('/config'),
  expenses: () => request<Expense[]>('/expenses'),
  reminders: () => request<Reminder[]>('/reminders'),
  health: () => request<HealthLog[]>('/health'),
  notes: () => request<Note[]>('/notes'),
  createNote: (note: NoteInput) =>
    request<Note>('/notes', { method: 'POST', body: JSON.stringify(note) }),
  updateNote: (id: number, note: NoteInput) =>
    request<Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(note) }),
};
