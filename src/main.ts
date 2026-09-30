import "./style.css";
import { Calculator, isOperator, type Operator } from "./calculator.ts";

type Action = "digit" | "decimal" | "operator" | "equals" | "clear" | "sign" | "negative" | "percent";
type Command = readonly [action: Action, value?: string];

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const calculator = new Calculator();
const display = getElement<HTMLOutputElement>("#display");
const expression = getElement<HTMLDivElement>("#expression");
const keypad = getElement<HTMLDivElement>("#keypad");
const helpDialog = getElement<HTMLDialogElement>("#help-dialog");
const helpButton = getElement<HTMLButtonElement>("#help-button");
const helpClose = getElement<HTMLButtonElement>("#help-close");

function render(): void {
  display.textContent = calculator.state.display;
  expression.textContent = calculator.state.expression;
  display.classList.toggle("display__value--error", calculator.state.display === "Error");
  display.classList.toggle("display__value--compact", calculator.state.display.length > 9);

  document.querySelectorAll<HTMLButtonElement>('[data-action="operator"]').forEach((button) => {
    const active = calculator.state.operator === button.dataset.value && calculator.state.waitingForRight;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function run(action: Action, value?: string): void {
  switch (action) {
    case "digit":
      if (value !== undefined) calculator.inputDigit(value);
      break;
    case "operator":
      if (isOperator(value)) calculator.chooseOperator(value);
      break;
    case "decimal": calculator.inputDecimal(); break;
    case "equals": calculator.equals(); break;
    case "clear": calculator.clear(); break;
    case "sign": calculator.toggleSign(); break;
    case "negative": calculator.startNegativeEntry(); break;
    case "percent": calculator.percent(); break;
  }
  render();
}

function isAction(value: string | undefined): value is Action {
  return value === "digit" || value === "decimal" || value === "operator" || value === "equals" ||
    value === "clear" || value === "sign" || value === "negative" || value === "percent";
}

keypad.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>("button");
  if (!button || !isAction(button.dataset.action)) return;
  run(button.dataset.action, button.dataset.value);
});

helpButton.addEventListener("click", () => helpDialog.showModal());
helpClose.addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

const keyboardMap: Readonly<Record<string, Command>> = {
  "/": ["operator", "÷"],
  "*": ["operator", "×"],
  "-": ["operator", "−"],
  "+": ["operator", "+"],
  ".": ["decimal"],
  ",": ["decimal"],
  "%": ["percent"],
  Enter: ["equals"],
  "=": ["equals"],
  Escape: ["clear"],
  Backspace: ["clear"],
};

window.addEventListener("keydown", (event) => {
  if (helpDialog.open) {
    if (event.key === "Escape") {
      event.preventDefault();
      helpDialog.close();
    }
    return;
  }

  const minusStartsNumber = event.key === "-" && (
    (calculator.state.display === "0" && calculator.state.operator === null) ||
    calculator.state.waitingForRight ||
    calculator.state.resetOnDigit
  );
  const command: Command | undefined = minusStartsNumber
    ? ["negative"]
    : /^\d$/.test(event.key)
      ? ["digit", event.key]
      : keyboardMap[event.key];
  if (!command) return;
  event.preventDefault();
  run(...command);

  const selector = command[1]
    ? `[data-value="${command[1]}"]`
    : `[data-action="${command[0]}"]`;
  const key = document.querySelector<HTMLButtonElement>(selector);
  key?.classList.add("is-pressed");
  window.setTimeout(() => key?.classList.remove("is-pressed"), 110);
});

render();
