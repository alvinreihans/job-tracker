import { expect, test } from "vitest";
import { countByStatus, matches } from "../lib/filter";
import type { Application } from "../lib/constants";

const row = (over: Partial<Application>): Application => ({
  id: "1",
  company: "PT Bank SMBC Indonesia Tbk",
  position: "Fullstack Developer",
  applied_at: "2026-10-13",
  job_url: null,
  location: null,
  source: "LinkedIn",
  status: "Applied",
  notes: null,
  responsibilities: null,
  requirements: null,
  ...over,
});

const all = { text: "", status: "", source: "" };

test("empty filter matches everything", () => {
  expect(matches(row({}), all)).toBe(true);
});

test("text matches company or position, case-insensitive and trimmed", () => {
  expect(matches(row({}), { ...all, text: "  smbc " })).toBe(true);
  expect(matches(row({}), { ...all, text: "FULLSTACK" })).toBe(true);
  expect(matches(row({}), { ...all, text: "kalibrr" })).toBe(false);
});

test("status and source filters combine with text", () => {
  expect(matches(row({}), { text: "bank", status: "Applied", source: "LinkedIn" })).toBe(true);
  expect(matches(row({}), { ...all, status: "Seen" })).toBe(false);
  expect(matches(row({}), { ...all, source: "Jobstreet" })).toBe(false);
});

test("countByStatus counts every status, including zero", () => {
  const counts = countByStatus([row({}), row({ id: "2" }), row({ id: "3", status: "Ditolak" })]);
  expect(counts.Applied).toBe(2);
  expect(counts.Ditolak).toBe(1);
  expect(counts.Offering).toBe(0);
  expect(Object.keys(counts)).toHaveLength(8);
});
