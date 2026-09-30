export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  createdAt: number;
}

type StorageAdapter = Pick<Storage, "getItem" | "setItem">;
type CreateId = () => string;

const STORAGE_KEY = "calculator-history";
const HISTORY_LIMIT = 100;

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<HistoryEntry>;
  return typeof entry.id === "string" &&
    typeof entry.expression === "string" &&
    typeof entry.result === "string" &&
    typeof entry.createdAt === "number" &&
    Number.isFinite(entry.createdAt) &&
    Math.abs(entry.createdAt) <= 8.64e15;
}

export class HistoryStore {
  entries: HistoryEntry[];
  private readonly storage: StorageAdapter;
  private readonly createId: CreateId;

  constructor(
    storage: StorageAdapter = localStorage,
    createId: CreateId = () => crypto.randomUUID(),
  ) {
    this.storage = storage;
    this.createId = createId;
    this.entries = this.load();
  }

  add(expression: string, result: string, createdAt = Date.now()): HistoryEntry {
    const entry: HistoryEntry = {
      id: this.createId(),
      expression,
      result,
      createdAt,
    };
    this.entries = [entry, ...this.entries].slice(0, HISTORY_LIMIT);
    this.save();
    return entry;
  }

  remove(id: string): void {
    this.entries = this.entries.filter((entry) => entry.id !== id);
    this.save();
  }

  clear(): void {
    this.entries = [];
    this.save();
  }

  private load(): HistoryEntry[] {
    try {
      const stored = this.storage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter(isHistoryEntry).slice(0, HISTORY_LIMIT) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // Calculation remains available if private browsing or storage limits block persistence.
    }
  }
}
