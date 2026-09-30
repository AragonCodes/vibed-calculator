import test from "node:test";
import assert from "node:assert/strict";
import { HistoryStore } from "../src/history.ts";

class MemoryStorage {
  private value: string | null = null;

  getItem(): string | null {
    return this.value;
  }

  setItem(_key: string, value: string): void {
    this.value = value;
  }
}

test("stores newest calculations first and persists them", () => {
  const storage = new MemoryStorage();
  let id = 0;
  const history = new HistoryStore(storage, () => String(++id));
  history.add("2 + 3", "5", 1000);
  history.add("5 × 4", "20", 2000);

  const restored = new HistoryStore(storage, () => "3");
  assert.deepEqual(restored.entries.map((entry) => entry.result), ["20", "5"]);
  assert.equal(restored.entries[0]?.createdAt, 2000);
});

test("removes one entry without affecting the others", () => {
  const storage = new MemoryStorage();
  let id = 0;
  const history = new HistoryStore(storage, () => String(++id));
  const first = history.add("1 + 1", "2");
  history.add("2 + 2", "4");
  history.remove(first.id);
  assert.deepEqual(history.entries.map((entry) => entry.result), ["4"]);
});

test("clears all history", () => {
  const history = new HistoryStore(new MemoryStorage(), () => "1");
  history.add("3 + 3", "6");
  history.clear();
  assert.deepEqual(history.entries, []);
});
