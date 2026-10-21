import { expect, test } from "vitest";
import { isStatus, validateApplication } from "../lib/validate";

const valid = {
  company: "  PT Contoh  ",
  position: "Fullstack Developer",
  applied_at: "2026-10-20",
  job_url: "https://www.linkedin.com/jobs/view/123",
  location: "",
  source: "LinkedIn",
  status: "Applied",
  notes: "",
  responsibilities: "• Develop\n• Review",
  requirements: "  ",
};

test("accepts valid input, trims text, turns empty optionals into null", () => {
  expect(validateApplication(valid)).toEqual({
    data: {
      company: "PT Contoh",
      position: "Fullstack Developer",
      applied_at: "2026-10-20",
      job_url: "https://www.linkedin.com/jobs/view/123",
      location: null,
      source: "LinkedIn",
      status: "Applied",
      notes: null,
      responsibilities: "• Develop\n• Review",
      requirements: null,
    },
  });
});

test("requires company and position", () => {
  const r = validateApplication({ ...valid, company: " ", position: undefined });
  expect(r.errors).toMatchObject({ company: expect.any(String), position: expect.any(String) });
});

test("rejects unknown status and source", () => {
  const r = validateApplication({ ...valid, status: "Hired", source: "Indeed" });
  expect(r.errors).toMatchObject({ status: expect.any(String), source: expect.any(String) });
});

test("rejects malformed or impossible dates", () => {
  expect(validateApplication({ ...valid, applied_at: "20/10/2026" }).errors?.applied_at).toBeDefined();
  expect(validateApplication({ ...valid, applied_at: "2026-02-30" }).errors?.applied_at).toBeDefined();
});

test("job_url must be http(s)", () => {
  expect(validateApplication({ ...valid, job_url: "javascript:alert(1)" }).errors?.job_url).toBeDefined();
  expect(validateApplication({ ...valid, job_url: "bukan url" }).errors?.job_url).toBeDefined();
  expect(validateApplication({ ...valid, job_url: "" }).data?.job_url).toBeNull();
});

test("rejects overly long text", () => {
  expect(validateApplication({ ...valid, company: "x".repeat(201) }).errors?.company).toBeDefined();
  expect(validateApplication({ ...valid, requirements: "x".repeat(10001) }).errors?.requirements).toBeDefined();
});

test("isStatus guards inline status edits", () => {
  expect(isStatus("Interview HR")).toBe(true);
  expect(isStatus("Hired")).toBe(false);
  expect(isStatus(undefined)).toBe(false);
});
