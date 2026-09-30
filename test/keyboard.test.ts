import test from "node:test";
import assert from "node:assert/strict";
import { Calculator } from "../src/calculator.ts";
import { shouldStartNegativeEntry } from "../src/keyboard.ts";

test("minus starts a negative number in a fresh calculation", () => {
  const calculator = new Calculator();
  assert.equal(shouldStartNegativeEntry(calculator.state), true);
});

test("minus starts a negative right operand", () => {
  const calculator = new Calculator();
  calculator.inputDigit("5");
  calculator.chooseOperator("×");
  assert.equal(shouldStartNegativeEntry(calculator.state), true);
});

test("minus continues subtraction after equals", () => {
  const calculator = new Calculator();
  calculator.inputDigit("5");
  calculator.chooseOperator("+");
  calculator.inputDigit("2");
  calculator.equals();
  assert.equal(shouldStartNegativeEntry(calculator.state), false);
});
