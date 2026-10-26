import { describe, expect, it } from "vite-plus/test";
import {
  check,
  defineSpec,
  formatValue,
  TlaEvaluationError,
  TlaSyntaxError,
  type SpecBuilder,
  type Term,
  type TermLike,
} from "../../src";

const getCounts = (spec: Parameters<typeof check>[0]) => {
  const result = check(spec);
  return [result.status, result.generatedStates, result.distinctStates, result.depth];
};

const counter = defineSpec((tla) => {
  const limit = tla.constant("Limit", 3);
  const count = tla.variable("count");
  const increment = tla.define(
    "Increment",
    tla.and(count.lt(limit), count.prime().eq(count.plus(1))),
  );
  return { init: count.eq(0), next: increment };
});

const waterJugs = defineSpec((tla) => {
  const smallCapacity = tla.constant("SmallCapacity", 3);
  const largeCapacity = tla.constant("LargeCapacity", 5);
  const goal = tla.constant("Goal", 4);
  const small = tla.variable("small");
  const large = tla.variable("large");
  const min = (left: Term, right: Term) => tla.ifThenElse(left.lt(right), left, right);
  const pour = (from: Term, to: Term, capacity: Term) => {
    const poured = min(from, capacity.minus(to));
    return tla.and(from.prime().eq(from.minus(poured)), to.prime().eq(to.plus(poured)));
  };
  return {
    init: tla.and(small.eq(0), large.eq(0)),
    next: tla.or(
      tla.define("FillSmall", tla.and(small.prime().eq(smallCapacity), large.prime().eq(large))),
      tla.define("FillLarge", tla.and(large.prime().eq(largeCapacity), tla.unchanged(small))),
      tla.define("EmptySmall", tla.and(small.prime().eq(0), tla.unchanged(large))),
      tla.define("EmptyLarge", tla.and(large.prime().eq(0), tla.unchanged(small))),
      tla.define("PourSmallIntoLarge", pour(small, large, largeCapacity)),
      tla.define("PourLargeIntoSmall", pour(large, small, smallCapacity)),
    ),
    invariants: {
      TypeOK: tla.and(small.in(tla.range(0, smallCapacity)), large.in(tla.range(0, largeCapacity))),
      GoalNotReached: large.neq(goal),
    },
  };
});

const commit = defineSpec((tla) => {
  const participants = tla.constant("Participants", [
    tla.modelValue("first"),
    tla.modelValue("second"),
    tla.modelValue("third"),
  ]);
  const participantState = tla.variable("participantState");
  const coordinatorState = tla.variable("coordinatorState");
  const prepared = tla.variable("prepared");
  const messages = tla.variable("messages");
  const messageSet = tla.define(
    "Messages",
    tla
      .recordSet({ kind: tla.set("prepared"), from: participants })
      .union(tla.recordSet({ kind: tla.set("commit", "abort") })),
  );
  const coordinatorCommit = tla.define(
    "CoordinatorCommit",
    tla.and(
      coordinatorState.eq("init"),
      prepared.eq(participants),
      coordinatorState.prime().eq("done"),
      messages.prime().eq(messages.union(tla.set(tla.record({ kind: "commit" })))),
      tla.unchanged(participantState, prepared),
    ),
  );
  const coordinatorAbort = tla.define(
    "CoordinatorAbort",
    tla.and(
      coordinatorState.eq("init"),
      coordinatorState.prime().eq("done"),
      messages.prime().eq(messages.union(tla.set(tla.record({ kind: "abort" })))),
      tla.unchanged(participantState, prepared),
    ),
  );
  const coordinatorReceive = tla.operator("CoordinatorReceive", (participant) =>
    tla.and(
      coordinatorState.eq("init"),
      tla.record({ kind: "prepared", from: participant }).in(messages),
      prepared.prime().eq(prepared.union(tla.set(participant))),
      tla.unchanged(participantState, coordinatorState, messages),
    ),
  );
  const prepare = tla.operator("Prepare", (participant) =>
    tla.and(
      participantState.at(participant).eq("working"),
      participantState.prime().eq(participantState.except(participant, "prepared")),
      messages
        .prime()
        .eq(messages.union(tla.set(tla.record({ kind: "prepared", from: participant })))),
      tla.unchanged(coordinatorState, prepared),
    ),
  );
  const decide = tla.operator("Decide", (participant) =>
    tla.or(
      ...[
        ["commit", "committed"],
        ["abort", "aborted"],
      ].map(([decision, outcome]) =>
        tla.and(
          tla.record({ kind: decision }).in(messages),
          participantState.prime().eq(participantState.except(participant, outcome)),
          tla.unchanged(coordinatorState, prepared, messages),
        ),
      ),
    ),
  );
  return {
    init: tla.and(
      participantState.eq(tla.fn(participants, () => "working")),
      coordinatorState.eq("init"),
      prepared.eq(tla.set()),
      messages.eq(tla.set()),
    ),
    next: tla.or(
      coordinatorCommit,
      coordinatorAbort,
      tla.exists(participants, (participant) =>
        tla.or(coordinatorReceive(participant), prepare(participant), decide(participant)),
      ),
    ),
    invariants: {
      TypeOK: tla.and(
        participantState.in(
          tla.functions(participants, tla.set("working", "prepared", "committed", "aborted")),
        ),
        coordinatorState.in(tla.set("init", "done")),
        prepared.subsetOf(participants),
        messages.subsetOf(messageSet),
      ),
      Consistent: tla.forall(participants, (first, second) =>
        tla.not(
          tla.and(
            participantState.at(first).eq("aborted"),
            participantState.at(second).eq("committed"),
          ),
        ),
      ),
    },
    checkDeadlock: false,
  };
});

const defineLiveness = (
  getFairness: (tla: SpecBuilder, actions: LivenessActions) => TermLike[],
  getProperty: (tla: SpecBuilder, model: LivenessModel) => TermLike,
) =>
  defineSpec((tla) => {
    const processes = tla.constant("Processes", [tla.modelValue("p1"), tla.modelValue("p2")]);
    const limit = tla.constant("Limit", 2);
    const count = tla.variable("count");
    const location = tla.variable("location");
    const token = tla.variable("token");
    const increment = tla.define(
      "Increment",
      tla.and(count.lt(limit), count.prime().eq(count.plus(1)), tla.unchanged(location, token)),
    );
    const request = tla.operator("Request", (process) =>
      tla.and(
        location.at(process).eq("idle"),
        location.prime().eq(location.except(process, "waiting")),
        tla.unchanged(count, token),
      ),
    );
    const enter = tla.operator("Enter", (process) =>
      tla.and(
        location.at(process).eq("waiting"),
        token.eq(process),
        location.prime().eq(location.except(process, "critical")),
        tla.unchanged(count, token),
      ),
    );
    const leave = tla.operator("Leave", (process) =>
      tla.and(
        location.at(process).eq("critical"),
        location.prime().eq(location.except(process, "idle")),
        token.prime().in(processes.difference(tla.set(process))),
        tla.unchanged(count),
      ),
    );
    const pass = tla.operator("Pass", (process) =>
      tla.and(
        token.eq(process),
        location.at(process).eq("idle"),
        token.prime().in(processes.difference(tla.set(process))),
        tla.unchanged(count, location),
      ),
    );
    const step = tla.operator("Step", (process) =>
      tla.or(request(process), enter(process), leave(process), pass(process)),
    );
    const model = { processes, limit, count, location, token, pass, leave };
    return {
      init: tla.and(count.eq(0), location.eq(tla.fn(processes, () => "idle")), token.in(processes)),
      next: tla.or(
        increment,
        tla.exists(processes, (process) => step(process)),
      ),
      fairness: getFairness(tla, { processes, increment, step, enter }),
      properties: { Property: getProperty(tla, model) },
      checkDeadlock: false,
    };
  });

interface LivenessActions {
  processes: Term;
  increment: Term;
  step: (process: TermLike) => Term;
  enter: (process: TermLike) => Term;
}

interface LivenessModel {
  processes: Term;
  limit: Term;
  count: Term;
  location: Term;
  token: Term;
  pass: (process: TermLike) => Term;
  leave: (process: TermLike) => Term;
}

const FAIRNESS: Record<string, (tla: SpecBuilder, actions: LivenessActions) => TermLike[]> = {
  Unfair: () => [],
  Fair: (tla, actions) => [
    tla.weakFairness(actions.increment),
    tla.forall(actions.processes, (process) => tla.weakFairness(actions.step(process))),
  ],
  Strong: (tla, actions) => [
    tla.weakFairness(actions.increment),
    tla.forall(actions.processes, (process) =>
      tla.and(tla.strongFairness(actions.enter(process)), tla.weakFairness(actions.step(process))),
    ),
  ],
};

const PROPERTIES: Record<string, (tla: SpecBuilder, model: LivenessModel) => TermLike> = {
  ReachesLimit: (tla, model) => tla.eventually(model.count.eq(model.limit)),
  StaysAtLimit: (tla, model) => tla.eventually(tla.always(model.count.eq(model.limit))),
  Served: (tla, model) =>
    tla.forall(model.processes, (process) =>
      tla.leadsTo(
        model.location.at(process).eq("waiting"),
        model.location.at(process).eq("critical"),
      ),
    ),
  TokenMoves: (tla, model) =>
    tla.always(
      tla.eventually(
        tla.angleAction(
          tla.exists(model.processes, (process) =>
            tla.or(model.pass(process), model.leave(process)),
          ),
          model.token,
        ),
      ),
    ),
  NeverCritical: (tla, model) =>
    tla.eventually(
      tla.forall(model.processes, (process) => model.location.at(process).eq("critical")),
    ),
};

const TLC_LIVENESS_VERDICTS: [string, string, string][] = [
  ["Unfair", "ReachesLimit", "liveness-violation"],
  ["Unfair", "StaysAtLimit", "liveness-violation"],
  ["Unfair", "Served", "liveness-violation"],
  ["Unfair", "TokenMoves", "liveness-violation"],
  ["Unfair", "NeverCritical", "liveness-violation"],
  ["Fair", "ReachesLimit", "success"],
  ["Fair", "StaysAtLimit", "success"],
  ["Fair", "Served", "success"],
  ["Fair", "TokenMoves", "success"],
  ["Fair", "NeverCritical", "liveness-violation"],
  ["Strong", "ReachesLimit", "success"],
  ["Strong", "StaysAtLimit", "success"],
  ["Strong", "Served", "success"],
  ["Strong", "TokenMoves", "success"],
  ["Strong", "NeverCritical", "liveness-violation"],
];

describe("defineSpec matches TLC", () => {
  it("reports deadlock with named actions in the trace", () => {
    const result = check({ spec: counter });
    expect(result.status).toBe("deadlock");
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "Increment",
      "Increment",
      "Increment",
    ]);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("reports the shortest trace to an invariant violation", () => {
    const result = check({ spec: waterJugs });
    expect(result.status).toBe("invariant-violation");
    expect(result.violation?.name).toBe("GoalNotReached");
    const trace = result.violation?.trace ?? [];
    expect(trace).toHaveLength(7);
    expect(formatValue(trace[6].state.large)).toBe("4");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([73, 14, 7]);
  });

  it("explores a commit protocol over model values", () => {
    expect(getCounts({ spec: commit })).toEqual(["success", 890, 251, 11]);
  });

  it.each(TLC_LIVENESS_VERDICTS)("checks %s %s as %s", (fairness, property, status) => {
    const result = check({ spec: defineLiveness(FAIRNESS[fairness], PROPERTIES[property]) });
    expect([result.status, result.generatedStates, result.distinctStates]).toEqual([
      status,
      92,
      36,
    ]);
  });

  it("reduces states under a symmetry set", () => {
    const spec = defineSpec((tla) => {
      const proc = tla.constant("Proc", ["p1", "p2", "p3"].map(tla.modelValue));
      const value = tla.constant("Value", ["v1", "v2"].map(tla.modelValue));
      const votes = tla.variable("votes");
      const owner = tla.variable("owner");
      return {
        init: tla.and(votes.eq(tla.fn(proc, () => 0)), owner.in(value)),
        next: tla.or(
          tla.exists(proc, (process) =>
            tla.and(
              votes.at(process).lt(2),
              votes.prime().eq(votes.except(process, (current) => current.plus(1))),
              tla.unchanged(owner),
            ),
          ),
          tla.exists(value, (candidate) =>
            tla.and(owner.prime().eq(candidate), tla.unchanged(votes)),
          ),
        ),
        symmetry: tla.call("Permutations", proc).union(tla.call("Permutations", value)),
      };
    });
    expect(getCounts({ spec })).toEqual(["success", 42, 10, 7]);
  });
});

describe("defineSpec", () => {
  it("checks the same spec more than once", () => {
    expect(getCounts({ spec: commit })).toEqual(getCounts({ spec: commit }));
  });

  it("evaluates recursive operators", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const factorial = tla.operator("Factorial", (n) =>
        tla.ifThenElse(n.eq(0), 1, n.times(factorial(n.minus(1)))),
      );
      return {
        init: x.eq(0),
        next: tla.and(x.lt(5), x.prime().eq(x.plus(1))),
        invariants: { Small: factorial(x).lt(100) },
      };
    });
    const result = check({ spec });
    expect(result.status).toBe("invariant-violation");
    expect(formatValue(result.violation?.trace.at(-1)?.state.x ?? 0)).toBe("5");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([6, 6, 6]);
  });

  it("reuses a defined term as a named invariant", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const typeOK = tla.define("TypeOK", x.in(tla.range(-1, 1)));
      return { init: x.eq(-1), next: x.prime().eq(x.plus(1)), invariants: { TypeOK: typeOK } };
    });
    const result = check({ spec });
    expect(result.violation?.name).toBe("TypeOK");
    expect(result.violation?.trace).toHaveLength(4);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([4, 4, 4]);
  });

  it("rejects names that are declared twice", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      tla.define("x", 1);
      return { init: x.eq(0), next: x.prime().eq(x) };
    });
    expect(() => check({ spec })).toThrow(TlaSyntaxError);
  });

  it("rejects names that are not TLA+ identifiers", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("not valid");
      return { init: x.eq(0), next: x.prime().eq(x) };
    });
    expect(() => check({ spec })).toThrow(TlaSyntaxError);
  });

  it("reports 32-bit overflow like TLC", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      return { init: x.eq(2147483647), next: x.prime().eq(x.plus(1)) };
    });
    expect(() => check({ spec })).toThrow(TlaEvaluationError);
  });
});
