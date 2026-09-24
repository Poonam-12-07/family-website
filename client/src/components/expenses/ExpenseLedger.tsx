import { motion } from 'framer-motion';
import { ListFilter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Expense } from '@/lib/api';
import { amountOf, categorize } from '@/lib/expenses';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const HEAD = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground';

export function ExpenseLedger({ expenses }: { expenses: Expense[] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-primary" />
            <CardTitle className="text-base font-semibold">Expense Ledger</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            {expenses.length} transaction{expenses.length !== 1 ? 's' : ''} recorded
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {expenses.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">No expenses to display</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className={HEAD}>Timestamp</TableHead>
                    <TableHead className={HEAD}>Shop</TableHead>
                    <TableHead className={`${HEAD} hidden sm:table-cell`}>Comments</TableHead>
                    <TableHead className={`${HEAD} text-right`}>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((e, i) => (
                    <TableRow key={e.id} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(e.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-foreground">{e.shop}</span>
                          <Badge variant="secondary" className="w-fit text-[10px] px-1.5 py-0">
                            {categorize(e.shop)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate hidden sm:table-cell">
                        {e.comments || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-bold text-accent">{formatCurrency(amountOf(e))}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
