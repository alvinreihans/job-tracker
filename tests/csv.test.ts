import { expect, test } from "vitest";
import { CSV_HEADERS, toCsv } from "../lib/csv";
import type { Application } from "../lib/constants";

const row: Application = {
  id: "1",
  company: "PT Contoh, Tbk",
  position: 'Developer "Fullstack"',
  applied_at: "2026-10-13",
  job_url: "https://example.com/job?id=1",
  location: null,
  source: "LinkedIn",
  status: "Interview HR",
  notes: "Gaji: Rp 7.000.000 – Rp 10.000.000\nFull time",
  responsibilities: "• Develop API\n\n- Review kode",
  requirements: null,
};

const lines = (csv: string) => csv.slice(1).split("\r\n");

test("starts with UTF-8 BOM so Excel reads non-ASCII correctly", () => {
  expect(toCsv([]).charCodeAt(0)).toBe(0xfeff);
});

test("header row matches the original Excel columns", () => {
  expect(lines(toCsv([]))[0]).toBe(CSV_HEADERS.join(","));
  expect(CSV_HEADERS[0]).toBe("Nama Perusahaan");
});

test("escapes commas, quotes and newlines; keeps en dash; empty for null", () => {
  const csv = toCsv([row]);
  expect(csv).toContain('"PT Contoh, Tbk"');
  expect(csv).toContain('"Developer ""Fullstack"""');
  expect(csv).toContain('"Gaji: Rp 7.000.000 – Rp 10.000.000\nFull time"');
  expect(csv).toContain("2026-10-13,https://example.com/job?id=1,,LinkedIn,Interview HR,");
  expect(csv.endsWith(",")).toBe(true); // requirements null → sel kosong terakhir
});

test("exports points as bullets so cells never start with '-'", () => {
  expect(toCsv([row])).toContain('"• Develop API\n• Review kode"');
});

test("neutralises spreadsheet formulas", () => {
  const csv = toCsv([{ ...row, company: "=HYPERLINK(\"x\")", position: "+1", location: "@SUM(A1)", notes: "-2" }]);
  expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
  expect(csv).toContain("'+1");
  expect(csv).toContain("'@SUM(A1)");
  expect(csv).toContain("'-2");
});

test("one line per row plus header, CRLF separated", () => {
  expect(lines(toCsv([row, { ...row, id: "2", notes: null }])).length).toBeGreaterThanOrEqual(3);
});
