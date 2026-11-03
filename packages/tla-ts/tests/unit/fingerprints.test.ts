import { describe, expect, it } from "vite-plus/test";
import { createTlcFingerprinter, getTlcFingerprint } from "../../src/tlc/fingerprint";
import {
  createModelValue,
  createRecord,
  createSet,
  createTuple,
  type Value,
} from "../../src/values";

describe("the fingerprinter for stored states", () => {
  it("matches TLC's fingerprint when states share and repeat values", () => {
    const queue = createTuple([1, -2, 2147483647, -2147483648]);
    const message = createRecord([
      ["type", "req"],
      ["queue", queue],
    ]);
    const network = createSet([message, createRecord([["type", "ack"]])]);
    const values: Value[] = [
      true,
      false,
      0,
      "",
      "long string ".repeat(40),
      createModelValue("m1"),
      createSet([]),
      queue,
      message,
      network,
      createTuple([network, network, queue]),
    ];
    const states = values.flatMap((first) =>
      values.map((second, index) => [first, second, values[(index * 7) % values.length], first]),
    );
    expect([...createTlcFingerprinter([0, 1, 2, 3])(states)]).toEqual(
      states.map((state) => BigInt.asIntN(64, getTlcFingerprint(state))),
    );
  });

  it("matches a fresh fingerprinter across batches that share values, past its limit", () => {
    const order = [2, 0, 1];
    const shared = createRecord([
      ["active", createSet([createModelValue("p1"), createModelValue("p2")])],
      ["count", 3],
    ]);
    const batches = Array.from({ length: 40 }, (_, level) => {
      const queue = createTuple(Array.from({ length: level % 9 }, (_, index) => index - level));
      return Array.from({ length: 6 }, (_, index) => [
        index % 2 === 0,
        createTuple([shared, queue, "s".repeat(index)]),
        index === 0 ? shared : createSet([queue, createTuple([level, index])]),
      ]);
    });
    const expected = batches.map((batch) =>
      batch.map((state) =>
        BigInt.asIntN(64, getTlcFingerprint(order.map((index) => state[index]))),
      ),
    );
    for (const limit of [undefined, 1, 5]) {
      const fingerprint = createTlcFingerprinter(order, limit);
      const reused = batches.map((batch) => [...fingerprint(batch)]);
      expect(reused).toEqual(batches.map((batch) => [...createTlcFingerprinter(order)(batch)]));
      expect(reused).toEqual(expected);
    }
  });
});
