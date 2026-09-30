import test from "node:test";
import assert from "node:assert/strict";
import { copyText } from "../src/clipboard.ts";

test("copies the unformatted result", async () => {
  let copied = "";
  const success = await copyText("1234.5", {
    writeText(value: string) {
      copied = value;
      return Promise.resolve();
    },
  });
  assert.equal(success, true);
  assert.equal(copied, "1234.5");
});

test("reports clipboard failures", async () => {
  const success = await copyText("42", {
    writeText() {
      return Promise.reject(new Error("denied"));
    },
  });
  assert.equal(success, false);
});
