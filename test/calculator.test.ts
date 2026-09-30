import test from "node:test";
import assert from "node:assert/strict";
import { Calculator } from "../src/calculator.ts";

function enter(calculator: Calculator, value: string | number): void {
  for (const digit of String(value)) {
    digit === "." ? calculator.inputDecimal() : calculator.inputDigit(digit);
  }
}

test("adds two values", () => {
  const calculator = new Calculator();
  enter(calculator, 12);
  calculator.chooseOperator("+");
  enter(calculator, 30);
  calculator.equals();
  assert.equal(calculator.state.display, "42");
});

test("chains operations", () => {
  const calculator = new Calculator();
  enter(calculator, 5);
  calculator.chooseOperator("×");
  enter(calculator, 6);
  calculator.chooseOperator("−");
  enter(calculator, 4);
  calculator.equals();
  assert.equal(calculator.state.display, "26");
});

test("handles decimals and percentages", () => {
  const calculator = new Calculator();
  enter(calculator, "12.5");
  calculator.percent();
  assert.equal(calculator.state.display, "0.125");
});

test("returns an error when dividing by zero and recovers", () => {
  const calculator = new Calculator();
  enter(calculator, 8);
  calculator.chooseOperator("÷");
  enter(calculator, 0);
  calculator.equals();
  assert.equal(calculator.state.display, "Error");
  calculator.inputDigit("7");
  assert.equal(calculator.state.display, "7");
});

test("starts a fresh calculation after equals", () => {
  const calculator = new Calculator();
  enter(calculator, 2);
  calculator.chooseOperator("+");
  enter(calculator, 3);
  calculator.equals();
  enter(calculator, 9);
  assert.equal(calculator.state.display, "9");
});

test("enters a leading negative number without creating an operation", () => {
  const calculator = new Calculator();
  calculator.startNegativeEntry();
  enter(calculator, 50);
  assert.equal(calculator.state.display, "-50");
  assert.equal(calculator.state.operator, null);
  assert.equal(calculator.state.expression, "");
});

test("accepts a negative number as the right operand", () => {
  const calculator = new Calculator();
  enter(calculator, 5);
  calculator.chooseOperator("×");
  calculator.startNegativeEntry();
  enter(calculator, 2);
  calculator.equals();
  assert.equal(calculator.state.display, "-10");
});
