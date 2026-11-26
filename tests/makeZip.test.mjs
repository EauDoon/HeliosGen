import assert from "node:assert/strict";
import test from "node:test";
import { makeZip } from "../lib/makeZip.ts";

test("stored entry sizes, bytes and central directory offsets respect subarrays", async () => {
  const source = Uint8Array.of(5, 65, 66, 67, 9);
  const shared = new Uint8Array(new SharedArrayBuffer(5));
  shared.set(source);
  const entries = [
    { name: "media", data: source.subarray(1, 4) },
    { name: "empty", data: source.subarray(2, 2) },
    { name: "buffer", data: Buffer.from(source).subarray(1, 4) },
    { name: "shared", data: shared.subarray(1, 4) },
  ];
  const bytes = new Uint8Array(await makeZip(entries).arrayBuffer());
  const view = new DataView(bytes.buffer);
  let cursor = 0;
  for (const entry of entries) {
    assert.equal(view.getUint32(cursor, true), 0x04034b50);
    assert.equal(view.getUint32(cursor + 18, true), entry.data.length);
    const start = cursor + 30 + view.getUint16(cursor + 26, true);
    cursor = start + entry.data.length;
    assert.deepEqual([...bytes.slice(start, cursor)], [...entry.data]);
  }
  assert.equal(view.getUint32(cursor, true), 0x02014b50);
  assert.equal(view.getUint32(bytes.length - 6, true), cursor);
});
