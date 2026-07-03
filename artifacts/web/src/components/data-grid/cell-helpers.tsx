import type { ICellRendererParams } from "ag-grid-community";

export function fmtDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function fmtDateTime(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtCurrency(value: unknown, currency = "PKR"): string {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${currency} ${n.toLocaleString()}`;
}

type Tone = "primary" | "secondary" | "success" | "warning" | "danger" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary dark:text-secondary-foreground",
  success:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function badgeRenderer<T>(
  map: (value: unknown, row: T) => { label: string; tone: Tone },
) {
  return (params: ICellRendererParams<T>) => {
    if (params.value == null || params.value === "") return null;
    const { label, tone } = map(params.value, params.data as T);
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TONE_CLASS[tone]}`}
      >
        {label}
      </span>
    );
  };
}

export function statusTone(status: string): Tone {
  const s = status.toLowerCase();
  if (["paid", "active", "completed", "success"].includes(s)) return "success";
  if (["pending", "processing", "completed_with_errors"].includes(s))
    return "warning";
  if (["failed", "cancelled", "error", "inactive", "suspended"].includes(s))
    return "danger";
  return "muted";
}
