import { describe, expect, it } from "vite-plus/test";
import { getTlcFingerprint, getTlcFingerprints } from "../../src/tlc/fingerprint";
import {
  createModelValue,
  createRecord,
  createSet,
  createTuple,
  type Value,
} from "../../src/values";

describe("the fingerprints of stored states", () => {
  it("match TLC's fingerprint of each state in the variable order", () => {
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
    const order = [2, 0, 1, 3];
    expect([...getTlcFingerprints(states.length, (index) => states[index], order)]).toEqual(
      states.map((state) =>
        BigInt.asIntN(64, getTlcFingerprint(order.map((index) => state[index]))),
      ),
    );
  });
});
