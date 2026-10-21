import { SOURCES, STATUSES, type Application, type Source, type Status } from "./constants";

export type ApplicationInput = Omit<Application, "id">;
export type FieldErrors = Partial<Record<keyof ApplicationInput, string>>;
export type Validation = { data: ApplicationInput; errors?: undefined } | { data?: undefined; errors: FieldErrors };

const SHORT = 200;
const LONG = 10000;

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export const isStatus = (v: unknown): v is Status => STATUSES.includes(v as Status);
const isSource = (v: unknown): v is Source => SOURCES.includes(v as Source);

function isRealDate(v: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const [y, m, d] = v.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function isHttpUrl(v: string) {
  try {
    return ["http:", "https:"].includes(new URL(v).protocol);
  } catch {
    return false;
  }
}

// Dipakai server action (batas kepercayaan). DB juga punya check constraint buat status & source.
export function validateApplication(raw: Record<string, unknown>): Validation {
  const errors: FieldErrors = {};
  const company = text(raw.company);
  const position = text(raw.position);
  const applied_at = text(raw.applied_at);
  const job_url = text(raw.job_url);
  const location = text(raw.location);
  const notes = text(raw.notes);
  const responsibilities = text(raw.responsibilities);
  const requirements = text(raw.requirements);

  if (!company) errors.company = "Nama perusahaan wajib diisi.";
  else if (company.length > SHORT) errors.company = `Maksimal ${SHORT} karakter.`;
  if (!position) errors.position = "Posisi wajib diisi.";
  else if (position.length > SHORT) errors.position = `Maksimal ${SHORT} karakter.`;
  if (!isRealDate(applied_at)) errors.applied_at = "Tanggal nggak valid.";
  if (job_url && !isHttpUrl(job_url)) errors.job_url = "Link harus diawali http:// atau https://.";
  if (location.length > SHORT) errors.location = `Maksimal ${SHORT} karakter.`;
  if (!isSource(raw.source)) errors.source = "Pilih platform dari daftar.";
  if (!isStatus(raw.status)) errors.status = "Pilih status dari daftar.";
  if (notes.length > LONG) errors.notes = `Maksimal ${LONG} karakter.`;
  if (responsibilities.length > LONG) errors.responsibilities = `Maksimal ${LONG} karakter.`;
  if (requirements.length > LONG) errors.requirements = `Maksimal ${LONG} karakter.`;

  if (Object.keys(errors).length) return { errors };
  return {
    data: {
      company,
      position,
      applied_at,
      job_url: job_url || null,
      location: location || null,
      source: raw.source as Source,
      status: raw.status as Status,
      notes: notes || null,
      responsibilities: responsibilities || null,
      requirements: requirements || null,
    },
  };
}
