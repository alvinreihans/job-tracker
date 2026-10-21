import { expect, test } from "vitest";
import { formatDate, toPoints, todayIso } from "../lib/format";

test("todayIso uses local date with zero padding", () => {
  expect(todayIso(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
});

test("toPoints splits lines and drops blanks", () => {
  expect(toPoints("Satu\n\n  Dua  \r\nTiga\n")).toEqual(["Satu", "Dua", "Tiga"]);
});

test("toPoints strips pasted bullets and numbering", () => {
  expect(toPoints("• Golang\n- Node.js\n* SQL\n1. Git\n2) Docker\n– CI/CD")).toEqual([
    "Golang",
    "Node.js",
    "SQL",
    "Git",
    "Docker",
    "CI/CD",
  ]);
});

test("toPoints keeps text that only looks like a bullet mid-line", () => {
  expect(toPoints("Node.js - backend\n3 years experience")).toEqual(["Node.js - backend", "3 years experience"]);
});

test("toPoints handles empty input", () => {
  expect(toPoints(null)).toEqual([]);
  expect(toPoints("")).toEqual([]);
});

test("formatDate renders Indonesian short date without timezone shift", () => {
  expect(formatDate("2026-10-09")).toBe("9 Okt 2026");
  expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
});
