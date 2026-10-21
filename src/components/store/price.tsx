import { formatCop } from "@/lib/money";

export function Price({ value, compareAt, className = "" }: { value: number; compareAt?: number | null; className?: string }) {
  return (
    <span className={`tabular-nums ${className}`}>
      {formatCop(value)}
      {compareAt && compareAt > value ? (
        <s className="ml-2 text-[0.85em] font-normal text-muted">
          <span className="sr-only">Antes </span>
          {formatCop(compareAt)}
        </s>
      ) : null}
    </span>
  );
}
