import type { Application } from "./constants";
import { toPoints } from "./format";

// Sama dengan kolom di "Job Tracker.xlsx" (+ detail dari sheet Detail).
export const CSV_HEADERS = [
  "Nama Perusahaan",
  "Posisi",
  "Tanggal Lamar",
  "Link Lowongan",
  "Lokasi",
  "Melamar Lewat",
  "Status Lamaran",
  "Catatan",
  "Responsibilities",
  "Requirements",
];

// Excel menganggap sel yang diawali = + - @ (atau tab/CR) sebagai formula: rawan CSV injection dan bikin "#NAME?".
const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: string | null): string {
  let v = value ?? "";
  if (FORMULA_START.test(v)) v = `'${v}`;
  return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const bullets = (text: string | null) => toPoints(text).map((p) => `• ${p}`).join("\n");

// BOM biar Excel baca UTF-8 (en dash, dll.), CRLF sesuai RFC 4180.
export function toCsv(rows: Application[]): string {
  const lines = rows.map((r) =>
    [
      r.company,
      r.position,
      r.applied_at,
      r.job_url,
      r.location,
      r.source,
      r.status,
      r.notes,
      bullets(r.responsibilities),
      bullets(r.requirements),
    ]
      .map(cell)
      .join(","),
  );
  return "﻿" + [CSV_HEADERS.join(","), ...lines].join("\r\n");
}
