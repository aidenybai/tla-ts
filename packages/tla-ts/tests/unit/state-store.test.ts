import { describe, expect, it } from "vite-plus/test";
import { createStateStore } from "../../src/state-store";
import { createRecord, createSet, type Value } from "../../src/values";

describe("state store", () => {
  it("reads back each state after a chunk's cells outgrow 16 bits", () => {
    const states: Value[][] = [
      [1, "a"],
      [2, createSet([1, 2])],
      [-7, createRecord([["x", 3]])],
      [70_000, "b"],
      [3, createSet([1, 2])],
    ];
    const store = createStateStore(false);
    states.forEach((state, index) => {
      store.canonicalizeState(state);
      store.add(state, state, index - 1, undefined, false);
    });
    expect(states.map((_, index) => store.getState(index))).toEqual(states);
    expect(states.map((state, index) => store.isStoredIdentically(index, state))).toEqual(
      states.map(() => true),
    );
    expect(states.map((_, index) => [store.getParent(index), store.getDepth(index)])).toEqual([
      [-1, 1],
      [0, 2],
      [1, 3],
      [2, 4],
      [3, 5],
    ]);
  });

  it("reads back each state's action, violation, and depth after its actions outgrow 16 bits", () => {
    const store = createStateStore(false);
    const count = 40_000;
    Array.from({ length: count }, (_, index) => {
      const state: Value[] = [index % 3];
      store.canonicalizeState(state);
      const parent = index < 2 ? -1 : Math.floor(index / 2) - 1;
      store.add(state, state, parent, index < 2 ? undefined : `Action${index}`, index % 7 === 0);
    });
    const sampled = [0, 1, 2, 3, 6, 100, 32_769, 39_999];
    expect(
      sampled.map((index) => [
        store.getAction(index),
        store.isViolating(index),
        store.getDepth(index),
      ]),
    ).toEqual(
      sampled.map((index) => [
        index < 2 ? undefined : `Action${index}`,
        index % 7 === 0,
        index < 2 ? 1 : Math.floor(Math.log2(index + 2)),
      ]),
    );
  });
});
