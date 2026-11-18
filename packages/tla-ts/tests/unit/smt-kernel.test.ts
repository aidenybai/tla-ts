import { describe, expect, it } from "vite-plus/test";
import { AssertedFormulas } from "../../src/prover/smt/solver/asserted-formulas";
import { AstManager, FAMILY_DATATYPE } from "../../src/prover/smt/solver/ast";
import { CgTable, isCongruent } from "../../src/prover/smt/solver/cg-table";
import { Context } from "../../src/prover/smt/solver/context";
import { Enode, NO_ENODES } from "../../src/prover/smt/solver/enode";
import { DtSolver } from "../../src/prover/smt/solver/euf/dt-solver";
import { mkThSolver } from "../../src/prover/smt/solver/euf/th-solvers";
import { NULL_LITERAL } from "../../src/prover/smt/solver/sat/clause";
import { ResourceLimit } from "../../src/prover/smt/solver/rlimit";
import { Goal2Sat } from "../../src/prover/smt/solver/sat/goal2sat";
import { Solver } from "../../src/prover/smt/solver/sat/solver";
import { parseSmtlib } from "../../src/prover/smt/solver/smtlib-parser";

const internalize = (lines: string[]) => {
  const manager = new AstManager(new ResourceLimit(Infinity));
  const problem = parseSmtlib(
    lines.join("\n"),
    manager,
    () => {},
    (error) => {
      throw error;
    },
  );
  const asserted = new AssertedFormulas(manager, false);
  const context = new Context(manager, {
    isMbqi: true,
    mbqiMaxIterations: 1000,
    relevancyLevel: 2,
  });
  for (const assertion of problem.assertions) asserted.assertExpr(assertion);
  context.setupContext(undefined, true, asserted);
  context.internalizeAssertions(asserted);
  context.propagate();
  const atom = problem.assertions[0];
  return {
    first: context.getEnode(manager.getArg(atom, 0)),
    second: context.getEnode(manager.getArg(atom, 1)),
  };
};

describe("the congruence table of the smt kernel", () => {
  it("merges two applications of a commutative declaration whose arguments are swapped", () => {
    const nodes = internalize([
      "(declare-const s (Array Int Bool))",
      "(declare-const t (Array Int Bool))",
      "(declare-fun p ((Array Int Bool) (Array Int Bool)) Bool)",
      "(assert (p ((_ map (xor (Bool Bool) Bool)) s t) ((_ map (xor (Bool Bool) Bool)) t s)))",
    ]);
    expect(nodes.first?.isCommutative).toBe(true);
    expect(nodes.first?.root).toBe(nodes.second?.root);
  });

  it("takes the commutativity of a map from the mapped declaration", () => {
    const nodes = internalize([
      "(declare-const s (Array Int Bool))",
      "(declare-const t (Array Int Bool))",
      "(declare-fun p ((Array Int Bool) (Array Int Bool)) Bool)",
      "(assert (p ((_ map (and (Bool Bool) Bool)) s t) ((_ map (and (Bool Bool) Bool)) t s)))",
    ]);
    expect(nodes.first?.root).toBe(nodes.second?.root);
  });

  it("does not merge the swapped applications of a declaration that is not commutative", () => {
    const nodes = internalize([
      "(declare-const s (Array Int Bool))",
      "(declare-const t (Array Int Bool))",
      "(declare-fun p ((Array Int Bool) (Array Int Bool)) Bool)",
      "(assert (p ((_ map (=> (Bool Bool) Bool)) s t) ((_ map (=> (Bool Bool) Bool)) t s)))",
    ]);
    expect(nodes.first?.isCommutative).toBe(false);
    expect(nodes.first?.root).not.toBe(nodes.second?.root);
  });

  it("looks a flat-associative declaration up in the n-ary table, in argument order", () => {
    const mkNode = (owner: number, first: Enode | null, second: Enode | null) =>
      new Enode(
        owner,
        first === null ? owner : 0,
        first === null ? 0 : 2,
        first,
        second,
        NO_ENODES,
        0,
        false,
        first !== null,
        false,
        false,
        false,
        true,
        0,
      );
    const left = mkNode(1, null, null);
    const right = mkNode(2, null, null);
    const sum = mkNode(3, left, right);
    const swapped = mkNode(4, right, left);
    const table = new CgTable();
    expect(table.insert(sum)).toBe(sum);
    expect(table.insert(swapped)).toBe(swapped);
    expect(isCongruent(sum, swapped)).toBe(true);
  });
});

describe("a theory explanation of sat.euf", () => {
  it("explains each equality from the node with the smaller id, as th_explain stores it", () => {
    const manager = new AstManager(new ResourceLimit(Infinity));
    const sat = new Solver(new Map(), manager.limit);
    const euf = new Goal2Sat(manager, sat, false, mkThSolver(new Map())).ensureEuf();
    const sort = manager.mkUninterpretedSort("U", []);
    const nodes = [0, 1, 2, 3].map(() => euf.egraph.mk(manager.mkFreshConst(null, sort), 0, []));
    const firstLit = 2 * sat.mkVar(true);
    const secondLit = 2 * sat.mkVar(true);
    sat.push();
    sat.assignScoped(firstLit);
    sat.assignScoped(secondLit);
    euf.egraph.merge(nodes[1], nodes[3], 0);
    euf.egraph.merge(nodes[0], nodes[1], 2 * firstLit);
    euf.egraph.merge(nodes[2], nodes[1], 2 * secondLit);
    euf.egraph.propagate();
    const owner = new DtSolver(euf, FAMILY_DATATYPE);
    const antecedents: number[] = [];
    euf.getAntecedents(
      NULL_LITERAL,
      owner.mkPropagation([], [[nodes[2], nodes[0]]], NULL_LITERAL),
      antecedents,
    );
    expect(antecedents).toEqual([firstLit, secondLit]);
  });
});
