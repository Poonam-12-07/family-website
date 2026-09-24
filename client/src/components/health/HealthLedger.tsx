import { motion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { HealthLog } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

const HEAD = 'font-semibold text-foreground text-xs uppercase tracking-wider';

export function HealthLedger({ logs }: { logs: HealthLog[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-600" />
              <CardTitle className="text-base font-semibold">Health Log Ledger</CardTitle>
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full font-medium">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-0">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">No health logs found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className={`pl-6 ${HEAD}`}>Timestamp</TableHead>
                  <TableHead className={HEAD}>Name</TableHead>
                  <TableHead className={`${HEAD} pr-6`}>Weight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log, i) => (
                  <TableRow key={log.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                    <TableCell className="pl-6 text-sm text-muted-foreground">{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{log.name || '—'}</TableCell>
                    <TableCell className="pr-6 text-sm font-bold text-violet-700">{log.weight || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
