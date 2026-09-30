import test from "node:test";
import assert from "node:assert/strict";
import { formatDisplayNumber, formatExpressionNumbers } from "../src/number-format.ts";

test("groups thousands without changing the stored value", () => {
  assert.equal(formatDisplayNumber("1234567.89", "en-US"), "1,234,567.89");
});

test("uses the locale decimal and grouping separators", () => {
  assert.equal(formatDisplayNumber("1234567.89", "de-DE"), "1.234.567,89");
});

test("preserves an unfinished decimal while typing", () => {
  assert.equal(formatDisplayNumber("12.", "en-US"), "12.");
  assert.equal(formatDisplayNumber("12.", "de-DE"), "12,");
});

test("uses scientific notation for very large and small results", () => {
  assert.match(formatDisplayNumber("1000000000000", "en-US"), /^1E12$/);
  assert.match(formatDisplayNumber("0.0000000001", "en-US"), /^1E-10$/);
});

test("formats numbers inside expressions", () => {
  assert.equal(
    formatExpressionNumbers("1000 × (2500 + -3) =", "en-US"),
    "1,000 × (2,500 + -3) =",
  );
});

test("leaves calculator errors untouched", () => {
  assert.equal(formatDisplayNumber("Error", "en-US"), "Error");
});
