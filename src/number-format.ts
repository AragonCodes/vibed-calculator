const SCIENTIFIC_UPPER_BOUND = 1e12;
const SCIENTIFIC_LOWER_BOUND = 1e-9;

function decimalSeparator(locale: string): string {
  return new Intl.NumberFormat(locale)
    .formatToParts(1.1)
    .find((part) => part.type === "decimal")?.value ?? ".";
}

export function formatDisplayNumber(value: string, locale: string): string {
  if (value === "Error") return value;

  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return value;

  const absoluteValue = Math.abs(numericValue);
  const useScientific = value.toLowerCase().includes("e") ||
    absoluteValue >= SCIENTIFIC_UPPER_BOUND ||
    (absoluteValue > 0 && absoluteValue < SCIENTIFIC_LOWER_BOUND);

  if (useScientific) {
    return new Intl.NumberFormat(locale, {
      notation: "scientific",
      maximumSignificantDigits: 10,
      useGrouping: false,
    }).format(numericValue);
  }

  const isNegative = value.startsWith("-");
  const unsigned = isNegative ? value.slice(1) : value;
  const [integer = "0", fraction] = unsigned.split(".");
  const signedInteger = `${isNegative ? "-" : ""}${integer}`;
  const groupedInteger = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(BigInt(signedInteger || "0"));
  const visibleInteger = isNegative && numericValue === 0 ? `-${groupedInteger}` : groupedInteger;

  if (fraction === undefined) return visibleInteger;
  return `${visibleInteger}${decimalSeparator(locale)}${fraction}`;
}

export function formatExpressionNumbers(expression: string, locale: string): string {
  return expression.replace(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi, (value) =>
    formatDisplayNumber(value, locale));
}

export function parseLocalizedNumber(value: string, locale: string): number {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
  const group = parts.find((part) => part.type === "group")?.value;
  const decimal = parts.find((part) => part.type === "decimal")?.value ?? ".";
  let normalized = value.trim().replace(/\s/g, "");
  if (group) normalized = normalized.split(group).join("");
  if (decimal !== ".") normalized = normalized.replace(decimal, ".");
  if (normalized === "" || normalized === "-" || normalized === ".") return Number.NaN;
  return Number(normalized);
}
