import { STATUSES, type Application, type Status } from "./constants";

// "" artinya semua.
export type Filter = { text: string; status: string; source: string };

export function matches(row: Application, { text, status, source }: Filter): boolean {
  const q = text.trim().toLowerCase();
  return (
    (!status || row.status === status) &&
    (!source || row.source === source) &&
    (!q || row.company.toLowerCase().includes(q) || row.position.toLowerCase().includes(q))
  );
}

export function countByStatus(rows: Application[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const r of rows) counts[r.status]++;
  return counts;
}
