export type Operator = "+" | "−" | "×" | "÷";
type ExpressionToken = string;

export interface CalculatorState {
  display: string;
  operator: Operator | null;
  waitingForRight: boolean;
  expression: string;
  resetOnDigit: boolean;
  tokens: ExpressionToken[];
  hasEntry: boolean;
}

const initialState = (): CalculatorState => ({
  display: "0",
  operator: null,
  waitingForRight: false,
  expression: "",
  resetOnDigit: false,
  tokens: [],
  hasEntry: false,
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
    if (this.state.display === "Error" || this.state.resetOnDigit) this.clear();

    const { display, waitingForRight, hasEntry } = this.state;
    if (waitingForRight || !hasEntry) {
      this.state.display = digit;
      this.state.waitingForRight = false;
      this.state.hasEntry = true;
      this.state.operator = null;
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
    if (this.state.display === "Error" || this.state.resetOnDigit) this.clear();

    if (this.state.waitingForRight || !this.state.hasEntry) {
      this.state.display = "0.";
      this.state.waitingForRight = false;
      this.state.hasEntry = true;
      this.state.operator = null;
    } else if (!this.state.display.includes(".")) {
      this.state.display += ".";
    }
  }

  toggleSign(): void {
    if (this.state.display === "Error") return;
    if (!this.state.hasEntry && !this.state.resetOnDigit) {
      this.startNegativeEntry();
      return;
    }
    this.state.display = this.state.display.startsWith("-")
      ? this.state.display.slice(1)
      : `-${this.state.display}`;
    this.state.hasEntry = true;
  }

  startNegativeEntry(): void {
    if (this.state.display === "Error" || this.state.resetOnDigit) this.clear();
    this.state.display = "-0";
    this.state.waitingForRight = false;
    this.state.hasEntry = true;
    this.state.operator = null;
  }

  percent(): void {
    if (this.state.display === "Error") return;
    this.state.display = this.format(Number(this.state.display) / 100);
    this.state.hasEntry = true;
  }

  chooseOperator(nextOperator: Operator): void {
    if (this.state.display === "Error") this.clear();

    if (this.state.resetOnDigit) {
      this.state.tokens = [];
      this.state.hasEntry = true;
      this.state.resetOnDigit = false;
    }

    if (this.state.hasEntry) this.commitEntry();
    const last = this.lastToken();

    if (isOperator(last)) {
      this.state.tokens[this.state.tokens.length - 1] = nextOperator;
    } else if (last !== undefined && last !== "(") {
      this.state.tokens.push(nextOperator);
    } else {
      return;
    }

    this.state.operator = nextOperator;
    this.state.waitingForRight = true;
    this.syncExpression();
  }

  inputOpenParenthesis(): void {
    if (this.state.display === "Error" || this.state.resetOnDigit) this.clear();

    if (this.state.hasEntry) {
      this.commitEntry();
      this.state.tokens.push("×");
    } else if (this.lastToken() === ")") {
      this.state.tokens.push("×");
    } else {
      const last = this.lastToken();
      if (last !== undefined && !isOperator(last) && last !== "(") return;
    }

    this.state.tokens.push("(");
    this.state.display = "0";
    this.state.hasEntry = false;
    this.state.waitingForRight = true;
    this.state.operator = null;
    this.syncExpression();
  }

  inputCloseParenthesis(): void {
    if (this.state.display === "Error" || this.state.resetOnDigit) return;
    if (this.state.hasEntry) this.commitEntry();

    const last = this.lastToken();
    if (this.parenthesisBalance() <= 0 || last === undefined || isOperator(last) || last === "(") return;

    this.state.tokens.push(")");
    this.state.waitingForRight = false;
    this.state.operator = null;
    this.syncExpression();
  }

  equals(): void {
    if (this.state.display === "Error" || this.state.resetOnDigit) return;
    if (this.state.hasEntry) this.commitEntry();

    const last = this.lastToken();
    if (last === undefined || isOperator(last) || last === "(") return;

    const balance = this.parenthesisBalance();
    if (balance < 0) return;
    for (let index = 0; index < balance; index += 1) this.state.tokens.push(")");

    const completedExpression = this.formatExpression(this.state.tokens);
    const result = this.evaluate(this.state.tokens);
    this.state.expression = `${completedExpression} =`;
    this.state.display = this.format(result);
    this.state.tokens = [];
    this.state.operator = null;
    this.state.waitingForRight = false;
    this.state.hasEntry = false;
    this.state.resetOnDigit = true;
  }

  private commitEntry(): void {
    this.state.tokens.push(this.state.display);
    this.state.hasEntry = false;
  }

  private lastToken(): string | undefined {
    return this.state.tokens.at(-1);
  }

  private parenthesisBalance(): number {
    return this.state.tokens.reduce((balance, token) => {
      if (token === "(") return balance + 1;
      if (token === ")") return balance - 1;
      return balance;
    }, 0);
  }

  private syncExpression(): void {
    this.state.expression = this.formatExpression(this.state.tokens);
  }

  private formatExpression(tokens: readonly ExpressionToken[]): string {
    return tokens.join(" ").replace(/\( /g, "(").replace(/ \)/g, ")");
  }

  private evaluate(tokens: readonly ExpressionToken[]): number {
    let cursor = 0;

    const parseExpression = (): number => {
      let value = parseTerm();
      while (tokens[cursor] === "+" || tokens[cursor] === "−") {
        const operator = tokens[cursor++];
        const right = parseTerm();
        value = operator === "+" ? value + right : value - right;
      }
      return value;
    };

    const parseTerm = (): number => {
      let value = parseFactor();
      while (tokens[cursor] === "×" || tokens[cursor] === "÷") {
        const operator = tokens[cursor++];
        const right = parseFactor();
        value = operator === "×" ? value * right : right === 0 ? Number.NaN : value / right;
      }
      return value;
    };

    const parseFactor = (): number => {
      const token = tokens[cursor++];
      if (token === "(") {
        const value = parseExpression();
        if (tokens[cursor++] !== ")") return Number.NaN;
        return value;
      }
      if (token === undefined || isOperator(token) || token === ")") return Number.NaN;
      return Number(token);
    };

    const result = parseExpression();
    return cursor === tokens.length ? result : Number.NaN;
  }

  private format(value: number): string {
    if (!Number.isFinite(value)) return "Error";
    return Number.parseFloat(value.toPrecision(12)).toString();
  }
}
