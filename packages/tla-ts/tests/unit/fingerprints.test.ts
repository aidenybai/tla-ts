import { describe, expect, it } from "vite-plus/test";
import { createTlcFingerprinter, getTlcFingerprint } from "../../src/tlc-random";
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
    const getFingerprint = createTlcFingerprinter();
    expect(states.map(getFingerprint)).toEqual(states.map(getTlcFingerprint));
  });
});
