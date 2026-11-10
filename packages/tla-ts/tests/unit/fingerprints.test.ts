import { describe, expect, it } from "vite-plus/test";
import { createStateStore } from "../../src/state-store";
import {
  getStoredTlcFingerprints,
  getTlcFingerprint,
  getTlcFingerprints,
} from "../../src/tlc/fingerprint";
import {
  createModelValue,
  createRecord,
  createSet,
  createTuple,
  type Value,
} from "../../src/values";

const getStates = () => {
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
    2147483647,
    "",
    "long string ".repeat(40),
    createModelValue("m1"),
    createSet([]),
    queue,
    message,
    network,
    createTuple([network, network, queue]),
  ];
  return values.flatMap((first) =>
    values.map((second, index) => [first, second, values[(index * 7) % values.length], first]),
  );
};

const ORDER = [2, 0, 1, 3];

const getExpectedFingerprints = (states: Value[][]) =>
  states.map((state) => BigInt.asIntN(64, getTlcFingerprint(ORDER.map((index) => state[index]))));

describe("the fingerprints of stored states", () => {
  it("match TLC's fingerprint of each state in the variable order", () => {
    const states = getStates();
    expect([...getTlcFingerprints(states.length, (index) => states[index], ORDER)]).toEqual(
      getExpectedFingerprints(states),
    );
  });

  it("match TLC's fingerprint of each state the store keeps", () => {
    const states = getStates();
    const store = createStateStore(false);
    states.forEach((state) => {
      store.canonicalizeState(state);
      store.add(state, state, -1, undefined, false);
    });
    expect([...getStoredTlcFingerprints(store.getFingerprintCells(), ORDER)]).toEqual(
      getExpectedFingerprints(states),
    );
  });
});
