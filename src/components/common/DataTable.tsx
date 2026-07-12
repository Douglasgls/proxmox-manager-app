import React from 'react';
import { Loading } from './Loading';
import { cn } from '@/lib/utils';

export interface ColumnDefinition<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDefinition<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  onRowClick,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-border bg-card shadow-sm', className)}>
      <table className="w-full text-sm border-collapse text-left">
        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                className={cn('h-10 px-4 text-xs font-semibold uppercase tracking-wider', col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50 text-foreground">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="h-32 text-center">
                <Loading message="Carregando dados..." />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm font-medium">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'hover:bg-muted/30 transition-colors duration-150',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col, colIndex) => {
                  const content =
                    typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode);

                  return (
                    <td key={colIndex} className={cn('p-4 align-middle font-medium', col.className)}>
                      {content ?? '-'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
export default DataTable;
