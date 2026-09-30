import "./style.css";
import { Calculator, isOperator } from "./calculator.ts";

type Action = "digit" | "decimal" | "operator" | "equals" | "clear" | "sign" | "negative" | "percent" | "open-parenthesis" | "close-parenthesis";
type Command = readonly [action: Action, value?: string];
type Theme =
  | "obsidian-dark" | "obsidian-light"
  | "aurora-dark" | "aurora-light"
  | "ember-dark" | "ember-light"
  | "ocean-dark" | "ocean-light"
  | "rose-dark" | "rose-light";

const themes: readonly Theme[] = [
  "obsidian-dark", "obsidian-light",
  "aurora-dark", "aurora-light",
  "ember-dark", "ember-light",
  "ocean-dark", "ocean-light",
  "rose-dark", "rose-light",
];

const themeColors: Record<Theme, string> = {
  "obsidian-dark": "#090b12",
  "obsidian-light": "#eeeefa",
  "aurora-dark": "#06110f",
  "aurora-light": "#e9f6f1",
  "ember-dark": "#140c09",
  "ember-light": "#f7eee6",
  "ocean-dark": "#06111b",
  "ocean-light": "#e8f3f8",
  "rose-dark": "#160b12",
  "rose-light": "#f8edf1",
};

function getElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Required element not found: ${selector}`);
  return element;
}

const calculator = new Calculator();
const display = getElement<HTMLOutputElement>("#display");
const expression = getElement<HTMLDivElement>("#expression");
const keypad = getElement<HTMLDivElement>("#keypad");
const expressionTools = getElement<HTMLDivElement>(".expression-tools");
const helpDialog = getElement<HTMLDialogElement>("#help-dialog");
const helpButton = getElement<HTMLButtonElement>("#help-button");
const helpClose = getElement<HTMLButtonElement>("#help-close");
const themeDialog = getElement<HTMLDialogElement>("#theme-dialog");
const themeButton = getElement<HTMLButtonElement>("#theme-button");
const themeClose = getElement<HTMLButtonElement>("#theme-close");
const themeColor = getElement<HTMLMetaElement>('meta[name="theme-color"]');
const themeOptions = document.querySelectorAll<HTMLButtonElement>("[data-theme-option]");

function isTheme(value: string | null | undefined): value is Theme {
  return value !== null && value !== undefined && themes.includes(value as Theme);
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  themeColor.content = themeColors[theme];
  localStorage.setItem("calculator-theme", theme);

  themeOptions.forEach((option) => {
    const selected = option.dataset.themeOption === theme;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-checked", String(selected));
  });
}

const savedTheme = localStorage.getItem("calculator-theme");
applyTheme(isTheme(savedTheme) ? savedTheme : "obsidian-dark");

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
    case "open-parenthesis": calculator.inputOpenParenthesis(); break;
    case "close-parenthesis": calculator.inputCloseParenthesis(); break;
  }
  render();
}

function isAction(value: string | undefined): value is Action {
  return value === "digit" || value === "decimal" || value === "operator" || value === "equals" ||
    value === "clear" || value === "sign" || value === "negative" || value === "percent" ||
    value === "open-parenthesis" || value === "close-parenthesis";
}

function handleActionClick(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>("button");
  if (!button || !isAction(button.dataset.action)) return;
  run(button.dataset.action, button.dataset.value);
}

keypad.addEventListener("click", handleActionClick);
expressionTools.addEventListener("click", handleActionClick);

helpButton.addEventListener("click", () => helpDialog.showModal());
helpClose.addEventListener("click", () => helpDialog.close());
helpDialog.addEventListener("click", (event) => {
  if (event.target === helpDialog) helpDialog.close();
});

themeButton.addEventListener("click", () => themeDialog.showModal());
themeClose.addEventListener("click", () => themeDialog.close());
themeDialog.addEventListener("click", (event) => {
  if (event.target === themeDialog) themeDialog.close();
});
themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const theme = option.dataset.themeOption;
    if (isTheme(theme)) applyTheme(theme);
  });
});

const keyboardMap: Readonly<Record<string, Command>> = {
  "/": ["operator", "÷"],
  "*": ["operator", "×"],
  "-": ["operator", "−"],
  "+": ["operator", "+"],
  ".": ["decimal"],
  ",": ["decimal"],
  "%": ["percent"],
  "(": ["open-parenthesis"],
  ")": ["close-parenthesis"],
  Enter: ["equals"],
  "=": ["equals"],
  Escape: ["clear"],
  Backspace: ["clear"],
};

window.addEventListener("keydown", (event) => {
  if (helpDialog.open || themeDialog.open) {
    if (event.key === "Escape") {
      event.preventDefault();
      if (helpDialog.open) helpDialog.close();
      if (themeDialog.open) themeDialog.close();
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
