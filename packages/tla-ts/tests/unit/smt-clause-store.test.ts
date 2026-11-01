import { describe, expect, it } from "vite-plus/test";
import { SmtInvariantError } from "../../src/errors";
import { CLS_AUX, CLS_LEARNED, CLS_TH_LEMMA, ClauseStore } from "../../src/prove/smt/solver/clause";
import { mkLiteral, toBoolVar } from "../../src/prove/smt/solver/literal";

const first = mkLiteral(toBoolVar(5));
const second = mkLiteral(toBoolVar(6), true);
const third = mkLiteral(toBoolVar(7));

describe("ClauseStore", () => {
  it("keeps the literals, activity, handler and atoms of a lemma", () => {
    const store = new ClauseStore();
    const delEh = () => {};
    const clause = store.mk([first, second, third], CLS_TH_LEMMA, null, delEh, [10, 11, 12]);
    expect(store.getLiterals(clause)).toEqual([first, second, third]);
    expect(store.isLemma(clause)).toBe(true);
    expect(store.getActivity(clause)).toBe(1);
    store.incActivity(clause);
    expect(store.getActivity(clause)).toBe(2);
    expect(store.getDelEh(clause)).toBe(delEh);
    expect(store.getJustification(clause)).toBeNull();
    store.swapLiterals(clause, 0, 2);
    expect(store.getLiterals(clause)).toEqual([third, second, first]);
    expect(store.getAtoms(clause)).toEqual([10, 11, 12]);
    expect([0, 1, 2].map((index) => store.getAtomSign(clause, index))).toEqual([
      false,
      true,
      false,
    ]);
    store.clearAtoms(clause);
    expect(store.getAtoms(clause)).toEqual([]);
  });

  it("keeps the flags of a clause apart", () => {
    const store = new ClauseStore();
    const clause = store.mk([first, second], CLS_AUX, null, null, null);
    expect(store.isLemma(clause)).toBe(false);
    store.setReinit(clause, true);
    store.markAsDeleted(clause);
    expect([store.isReinit(clause), store.isReinternalizeAtoms(clause)]).toEqual([true, false]);
    expect(store.isDeleted(clause)).toBe(true);
    expect(store.getKind(clause)).toBe(CLS_AUX);
    expect(store.getNumLiterals(clause)).toBe(2);
  });

  it("reuses a freed block and its handler slot for the next clause of its size", () => {
    const store = new ClauseStore();
    const firstEh = () => {};
    const secondEh = () => {};
    const kept = store.mk([first, second], CLS_TH_LEMMA, null, firstEh, null);
    const freed = store.mk([first, third], CLS_TH_LEMMA, null, secondEh, null);
    store.free(freed);
    expect(() => store.checkLive(freed)).toThrow(SmtInvariantError);
    const thirdEh = () => {};
    const reused = store.mk([second, third], CLS_TH_LEMMA, null, thirdEh, null);
    expect(reused).toBe(freed);
    expect(store.getDelEh(reused)).toBe(thirdEh);
    expect(store.getDelEh(kept)).toBe(firstEh);
    const other = store.mk([first, second, third], CLS_LEARNED, null, null, null);
    expect(other).not.toBe(freed);
    expect(store.getLiterals(kept)).toEqual([first, second]);
  });

  it("keeps the clauses when the store grows", () => {
    const store = new ClauseStore();
    const clauses = Array.from({ length: 20_000 }, (_, index) =>
      store.mk([mkLiteral(toBoolVar(index)), third], CLS_AUX, null, null, null),
    );
    expect(store.getLiteral(clauses[0], 0)).toBe(mkLiteral(toBoolVar(0)));
    expect(store.getLiteral(clauses[19_999], 0)).toBe(mkLiteral(toBoolVar(19_999)));
  });
});
