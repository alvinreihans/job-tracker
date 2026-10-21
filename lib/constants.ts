import type { StatusIndicatorProps } from "@cloudscape-design/components/status-indicator";

// Di-mirror di check constraint supabase/schema.sql. Ubah dua-duanya kalau nambah opsi.
export const STATUSES = [
  "Applied",
  "Seen",
  "Psikotes",
  "Interview HR",
  "Interview User",
  "Offering",
  "Diterima",
  "Ditolak",
] as const;
export type Status = (typeof STATUSES)[number];

export const SOURCES = [
  "Jobstreet",
  "Kalibrr",
  "LinkedIn",
  "Astra Career",
  "Glints",
  "Website Perusahaan",
  "Referral",
  "Lainnya",
] as const;
export type Source = (typeof SOURCES)[number];

export const STATUS_INDICATOR: Record<Status, StatusIndicatorProps.Type> = {
  Applied: "info",
  Seen: "info",
  Psikotes: "in-progress",
  "Interview HR": "in-progress",
  "Interview User": "in-progress",
  Offering: "success",
  Diterima: "success",
  Ditolak: "error",
};

export type Application = {
  id: string;
  company: string;
  position: string;
  applied_at: string; // "YYYY-MM-DD"
  job_url: string | null;
  location: string | null;
  source: Source;
  status: Status;
  notes: string | null;
  responsibilities: string | null;
  requirements: string | null;
};
