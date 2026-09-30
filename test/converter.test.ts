import test from "node:test";
import assert from "node:assert/strict";
import { convertUnits } from "../src/converter.ts";

test("converts meters to feet", () => {
  assert.ok(Math.abs(convertUnits(1, "length", "meter", "foot") - 3.280839895) < 1e-9);
});

test("converts kilograms to pounds", () => {
  assert.ok(Math.abs(convertUnits(1, "mass", "kilogram", "pound") - 2.20462262185) < 1e-9);
});

test("converts temperatures with offsets", () => {
  assert.equal(convertUnits(0, "temperature", "celsius", "fahrenheit"), 32);
  assert.equal(convertUnits(273.15, "temperature", "kelvin", "celsius"), 0);
});

test("rejects temperatures below absolute zero", () => {
  assert.equal(Number.isNaN(convertUnits(-1, "temperature", "kelvin", "celsius")), true);
});

test("converts liters to US gallons", () => {
  assert.ok(Math.abs(convertUnits(3.785411784, "volume", "liter", "gallon-us") - 1) < 1e-12);
});

test("uses decimal units for digital storage", () => {
  assert.equal(convertUnits(1000, "data", "megabyte", "gigabyte"), 1);
});

test("returns NaN for unknown units", () => {
  assert.equal(Number.isNaN(convertUnits(1, "length", "unknown", "meter")), true);
});
