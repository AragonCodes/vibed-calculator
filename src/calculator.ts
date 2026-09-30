export type Operator = "+" | "−" | "×" | "÷";

export interface CalculatorState {
  display: string;
  left: number | null;
  operator: Operator | null;
  waitingForRight: boolean;
  expression: string;
  resetOnDigit: boolean;
}

type Operation = (left: number, right: number) => number;

const operations: Record<Operator, Operation> = {
  "+": (left, right) => left + right,
  "−": (left, right) => left - right,
  "×": (left, right) => left * right,
  "÷": (left, right) => (right === 0 ? Number.NaN : left / right),
};

const initialState = (): CalculatorState => ({
  display: "0",
  left: null,
  operator: null,
  waitingForRight: false,
  expression: "",
  resetOnDigit: false,
});

export function isOperator(value: string | undefined): value is Operator {
  return value === "+" || value === "−" || value === "×" || value === "÷";
}

export class Calculator {
  state: CalculatorState;

  constructor() {
    this.state = initialState();
  }

  clear(): void {
    this.state = initialState();
  }

  inputDigit(digit: string): void {
    const { display, waitingForRight, resetOnDigit } = this.state;
    if (waitingForRight || resetOnDigit || display === "Error") {
      this.state.display = digit;
      this.state.waitingForRight = false;
      this.state.resetOnDigit = false;
      if (resetOnDigit) this.state.expression = "";
      return;
    }
    if (display.replace("-", "").length >= 12) return;
    if (display === "0") {
      this.state.display = digit;
    } else if (display === "-0") {
      this.state.display = `-${digit}`;
    } else {
      this.state.display = `${display}${digit}`;
    }
  }

  inputDecimal(): void {
    if (this.state.display === "Error" || this.state.resetOnDigit) {
      this.state.display = "0.";
      this.state.resetOnDigit = false;
      this.state.expression = "";
      return;
    }
    if (this.state.waitingForRight) {
      this.state.display = "0.";
      this.state.waitingForRight = false;
    } else if (!this.state.display.includes(".")) {
      this.state.display += ".";
    }
  }

  toggleSign(): void {
    if (this.state.display === "0" || this.state.display === "Error") return;
    this.state.display = this.state.display.startsWith("-")
      ? this.state.display.slice(1)
      : `-${this.state.display}`;
  }

  startNegativeEntry(): void {
    if (this.state.display === "Error" || this.state.resetOnDigit) this.clear();
    this.state.display = "-0";
    this.state.waitingForRight = false;
  }

  percent(): void {
    if (this.state.display === "Error") return;
    this.state.display = this.format(Number(this.state.display) / 100);
  }

  chooseOperator(nextOperator: Operator): void {
    if (this.state.display === "Error") this.clear();
    const input = Number(this.state.display);

    if (this.state.operator && !this.state.waitingForRight && this.state.left !== null) {
      const result = this.calculate(this.state.left, input, this.state.operator);
      this.state.display = this.format(result);
      this.state.left = result;
    } else {
      this.state.left = input;
    }

    this.state.operator = nextOperator;
    this.state.waitingForRight = true;
    this.state.resetOnDigit = false;
    this.state.expression = `${this.state.display} ${nextOperator}`;
  }

  equals(): void {
    if (!this.state.operator || this.state.waitingForRight || this.state.left === null) return;
    const right = Number(this.state.display);
    const left = this.state.left;
    const operator = this.state.operator;
    const result = this.calculate(left, right, operator);

    this.state.expression = `${this.format(left)} ${operator} ${this.format(right)} =`;
    this.state.display = this.format(result);
    this.state.left = null;
    this.state.operator = null;
    this.state.waitingForRight = false;
    this.state.resetOnDigit = true;
  }

  private calculate(left: number, right: number, operator: Operator): number {
    return operations[operator](left, right);
  }

  private format(value: number): string {
    if (!Number.isFinite(value)) return "Error";
    return Number.parseFloat(value.toPrecision(12)).toString();
  }
}
