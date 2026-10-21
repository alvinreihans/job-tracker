import { expect, test } from "vitest";
import { safeNext } from "../lib/redirect";

test("safeNext keeps in-app paths", () => {
  expect(safeNext("/")).toBe("/");
  expect(safeNext("/reset-password")).toBe("/reset-password");
});

test("safeNext rejects external or missing targets", () => {
  expect(safeNext(null)).toBe("/");
  expect(safeNext("")).toBe("/");
  expect(safeNext("https://evil.com")).toBe("/");
  expect(safeNext("//evil.com")).toBe("/");
  expect(safeNext("/\\evil.com")).toBe("/");
});
