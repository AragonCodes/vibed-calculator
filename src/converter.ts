export type UnitCategoryId = "length" | "mass" | "temperature" | "volume" | "data";

export interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  toBase: (value: number) => number;
  fromBase: (value: number) => number;
}

export interface UnitCategory {
  id: UnitCategoryId;
  name: string;
  units: readonly UnitDefinition[];
  defaults: readonly [from: string, to: string];
}

function scaledUnit(id: string, name: string, symbol: string, factor: number): UnitDefinition {
  return {
    id,
    name,
    symbol,
    toBase: (value) => value * factor,
    fromBase: (value) => value / factor,
  };
}

export const unitCategories: readonly UnitCategory[] = [
  {
    id: "length",
    name: "Length",
    defaults: ["meter", "foot"],
    units: [
      scaledUnit("millimeter", "Millimeters", "mm", 0.001),
      scaledUnit("centimeter", "Centimeters", "cm", 0.01),
      scaledUnit("meter", "Meters", "m", 1),
      scaledUnit("kilometer", "Kilometers", "km", 1000),
      scaledUnit("inch", "Inches", "in", 0.0254),
      scaledUnit("foot", "Feet", "ft", 0.3048),
      scaledUnit("yard", "Yards", "yd", 0.9144),
      scaledUnit("mile", "Miles", "mi", 1609.344),
    ],
  },
  {
    id: "mass",
    name: "Mass",
    defaults: ["kilogram", "pound"],
    units: [
      scaledUnit("milligram", "Milligrams", "mg", 0.000001),
      scaledUnit("gram", "Grams", "g", 0.001),
      scaledUnit("kilogram", "Kilograms", "kg", 1),
      scaledUnit("ounce", "Ounces", "oz", 0.028349523125),
      scaledUnit("pound", "Pounds", "lb", 0.45359237),
    ],
  },
  {
    id: "temperature",
    name: "Temperature",
    defaults: ["celsius", "fahrenheit"],
    units: [
      { id: "celsius", name: "Celsius", symbol: "°C", toBase: (value) => value, fromBase: (value) => value },
      { id: "fahrenheit", name: "Fahrenheit", symbol: "°F", toBase: (value) => (value - 32) * 5 / 9, fromBase: (value) => value * 9 / 5 + 32 },
      { id: "kelvin", name: "Kelvin", symbol: "K", toBase: (value) => value - 273.15, fromBase: (value) => value + 273.15 },
    ],
  },
  {
    id: "volume",
    name: "Volume",
    defaults: ["liter", "gallon-us"],
    units: [
      scaledUnit("milliliter", "Milliliters", "mL", 0.001),
      scaledUnit("liter", "Liters", "L", 1),
      scaledUnit("cup-us", "US cups", "cup", 0.2365882365),
      scaledUnit("quart-us", "US quarts", "qt", 0.946352946),
      scaledUnit("gallon-us", "US gallons", "gal", 3.785411784),
    ],
  },
  {
    id: "data",
    name: "Digital storage",
    defaults: ["megabyte", "gigabyte"],
    units: [
      scaledUnit("byte", "Bytes", "B", 1),
      scaledUnit("kilobyte", "Kilobytes", "KB", 1_000),
      scaledUnit("megabyte", "Megabytes", "MB", 1_000_000),
      scaledUnit("gigabyte", "Gigabytes", "GB", 1_000_000_000),
      scaledUnit("terabyte", "Terabytes", "TB", 1_000_000_000_000),
    ],
  },
];

export function isUnitCategoryId(value: string): value is UnitCategoryId {
  return unitCategories.some((category) => category.id === value);
}

export function convertUnits(
  value: number,
  categoryId: UnitCategoryId,
  fromId: string,
  toId: string,
): number {
  const category = unitCategories.find((item) => item.id === categoryId);
  const from = category?.units.find((unit) => unit.id === fromId);
  const to = category?.units.find((unit) => unit.id === toId);
  if (!category || !from || !to || !Number.isFinite(value)) return Number.NaN;

  const baseValue = from.toBase(value);
  if (categoryId === "temperature" && baseValue < -273.15) return Number.NaN;
  return to.fromBase(baseValue);
}
