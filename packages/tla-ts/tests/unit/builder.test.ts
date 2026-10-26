import { readFileSync } from "node:fs";
import { join } from "node:path";
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

const INSTANCES = join(import.meta.dirname, "../fixtures/instances");

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
  const coordinatorReceive = tla.operator("CoordinatorReceive", ["participant"], (participant) =>
    tla.and(
      coordinatorState.eq("init"),
      tla.record({ kind: "prepared", from: participant }).in(messages),
      prepared.prime().eq(prepared.union(tla.set(participant))),
      tla.unchanged(participantState, coordinatorState, messages),
    ),
  );
  const prepare = tla.operator("Prepare", ["participant"], (participant) =>
    tla.and(
      participantState.at(participant).eq("working"),
      participantState.prime().eq(participantState.except(participant, "prepared")),
      messages
        .prime()
        .eq(messages.union(tla.set(tla.record({ kind: "prepared", from: participant })))),
      tla.unchanged(coordinatorState, prepared),
    ),
  );
  const decide = tla.operator("Decide", ["participant"], (participant) =>
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
      Consistent: tla.forall([participants, participants], (first, second) =>
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
    const request = tla.operator("Request", ["process"], (process) =>
      tla.and(
        location.at(process).eq("idle"),
        location.prime().eq(location.except(process, "waiting")),
        tla.unchanged(count, token),
      ),
    );
    const enter = tla.operator("Enter", ["process"], (process) =>
      tla.and(
        location.at(process).eq("waiting"),
        token.eq(process),
        location.prime().eq(location.except(process, "critical")),
        tla.unchanged(count, token),
      ),
    );
    const leave = tla.operator("Leave", ["process"], (process) =>
      tla.and(
        location.at(process).eq("critical"),
        location.prime().eq(location.except(process, "idle")),
        token.prime().in(processes.difference(tla.set(process))),
        tla.unchanged(count),
      ),
    );
    const pass = tla.operator("Pass", ["process"], (process) =>
      tla.and(
        token.eq(process),
        location.at(process).eq("idle"),
        token.prime().in(processes.difference(tla.set(process))),
        tla.unchanged(count, location),
      ),
    );
    const step = tla.operator("Step", ["process"], (process) =>
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
        symmetry: proc.permutations().union(value.permutations()),
      };
    });
    expect(getCounts({ spec })).toEqual(["success", 42, 10, 7]);
  });

  it.each([
    [false, "success", 244, 27, 4],
    [true, "invariant-violation", 118, 27, 4],
  ])("substitutes into named instances when checking Different is %s", (isDifferent, ...counts) => {
    const spec = defineSpec((tla) => {
      const left = tla.variable("left");
      const right = tla.variable("right");
      const shared = tla.variable("shared");
      const values = tla.define("Values", tla.range(0, 2));
      const leftChannel = tla.instance("Left", "Channel", { Data: values, channel: left });
      const rightChannel = tla.instance("Right", "Channel", { Data: values, channel: right });
      const sharedChannel = tla.unnamedInstance("Channel", { Data: values, channel: shared });
      const pair = tla.parameterizedInstance("Pair", ["target"], "Channel", (target) => ({
        Data: values,
        channel: target,
      }));
      return {
        init: tla.and(left.eq(0), right.eq(0), shared.eq(0)),
        next: tla.or(
          tla.and(
            tla.exists(values, (item) => leftChannel("Send", item)),
            rightChannel("Idle"),
            sharedChannel("Idle"),
          ),
          tla.and(
            tla.exists(values, (item) => rightChannel("Send", item)),
            tla.unchanged(left, shared),
          ),
          tla.and(
            tla.exists(values, (item) => sharedChannel("Send", item)),
            tla.unchanged(left, right),
          ),
        ),
        invariants: {
          Safe: tla.and(leftChannel("TypeOK"), pair(right)("TypeOK"), sharedChannel("TypeOK")),
          ...(isDifferent ? { Different: left.plus(right).plus(shared).lt(6) } : {}),
        },
      };
    });
    const loadModule = (name: string) => readFileSync(join(INSTANCES, `${name}.tla`), "utf8");
    expect(getCounts({ spec, loadModule })).toEqual(counts);
  });

  it("deduplicates states by VIEW", () => {
    const spec = defineSpec((tla) => {
      const producers = tla.constant("P", [tla.modelValue("p1")]);
      const consumers = tla.constant("C", [tla.modelValue("c1"), tla.modelValue("c2")]);
      const capacity = tla.constant("K", 1);
      const buffer = tla.variable("buffer");
      const waitset = tla.variable("waitset");
      const pc = tla.variable("pc");
      const removeLast = tla.operator("RemoveLast", ["seq"], (seq) =>
        tla.fn(tla.range(1, seq.length().minus(1)), (index) => seq.at(index)),
      );
      const processes = tla.define("ProcSet", producers.union(consumers));
      const notify = tla.ifThenElse(
        waitset.neq(tla.set()),
        tla.exists(waitset, (waiter) => waitset.prime().eq(waitset.difference(tla.set(waiter)))),
        tla.and(true, tla.unchanged(waitset)),
      );
      const getStep = (label: string, isWaiting: Term, update: Term) =>
        tla.operator(label, ["self"], (self) =>
          tla.and(
            pc.at(self).eq(label),
            tla.ifThenElse(
              isWaiting,
              tla.and(
                waitset.prime().eq(waitset.union(tla.set(self))),
                pc.prime().eq(pc.except(self, label)),
                tla.unchanged(buffer),
              ),
              tla.and(buffer.prime().eq(update), notify, pc.prime().eq(pc.except(self, label))),
            ),
          ),
        );
      const produce = getStep("lbp", buffer.length().ge(capacity), buffer.append("d"));
      const producer = tla.operator("p", ["self"], (self) => produce(self));
      const consume = getStep("lbc", buffer.length().eq(0), removeLast(buffer));
      const consumer = tla.operator("c", ["self"], (self) => consume(self));
      return {
        init: tla.and(
          buffer.eq(tla.tuple()),
          waitset.eq(tla.set()),
          pc.eq(
            tla.fn(processes, (self) =>
              tla.cases([
                [self.in(producers), "lbp"],
                [self.in(consumers), "lbc"],
              ]),
            ),
          ),
        ),
        next: tla.or(
          tla.exists(producers, (self) => producer(self)),
          tla.exists(consumers, (self) => consumer(self)),
          tla.and(
            tla.forall(processes, (self) => pc.at(self).eq("Done")),
            tla.unchanged(buffer, waitset, pc),
          ),
        ),
        invariants: { Inv: waitset.neq(processes) },
        view: tla.tuple(buffer, waitset),
      };
    });
    const result = check({ spec });
    expect(result.violation?.name).toBe("Inv");
    expect(result.violation?.trace.map((step) => step.action)).toEqual([
      undefined,
      "lbc",
      "lbc",
      "lbp",
      "lbp",
      "lbc",
      "lbc",
      "lbc",
    ]);
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([43, 14, 8]);
  });
});

describe("defineSpec", () => {
  it("checks the same spec more than once", () => {
    expect(getCounts({ spec: commit })).toEqual(getCounts({ spec: commit }));
  });

  it("evaluates recursive operators", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const factorial = tla.operator("Factorial", ["n"], (n): Term =>
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

  it("evaluates LET and cartesian products", () => {
    const spec = defineSpec((tla) => {
      const pair = tla.variable("pair");
      const pairs = tla.product(tla.range(1, 2), tla.set("a", "b"));
      return {
        init: pair.in(pairs),
        next: tla.let(pair.at(1), (first) =>
          tla.and(first.lt(2), pair.prime().eq(tla.tuple(first.plus(1), pair.at(2)))),
        ),
        checkDeadlock: false,
      };
    });
    expect(getCounts({ spec })).toEqual(["success", 6, 4, 1]);
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

  it("passes LAMBDA to higher-order operators", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const twice = tla.instance("Twice", "Twice");
      const numbers = tla.tuple(3, 1, 2);
      return {
        init: x.eq(0),
        next: tla.and(
          x.lt(4),
          x.prime().eq(
            twice(
              "ApplyTwice",
              tla.lambda(["value"], (value) => value.plus(1)),
              x,
            ),
          ),
        ),
        invariants: {
          Sorted: numbers.sortSeq((left, right) => left.lt(right)).eq(tla.tuple(1, 2, 3)),
          Selected: numbers.selectSeq((element) => element.gt(1)).eq(tla.tuple(3, 2)),
        },
        checkDeadlock: false,
      };
    });
    const loadModule = () => "---- MODULE Twice ----\nApplyTwice(F(_), x) == F(F(x))\n====";
    expect(getCounts({ spec, loadModule })).toEqual(["success", 3, 3, 3]);
  });

  it("reports the TypeScript call site of a failing expression", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      return {
        init: x.eq(0),
        next: x.prime().eq(x),
        invariants: { Unbounded: tla.unboundedExists((value) => value.eq(x)) },
      };
    });
    expect(() => check({ spec })).toThrow(
      /TLC cannot evaluate an unbounded quantifier at line \d+, column \d+ of .*builder\.test\.ts/,
    );
  });

  it("extends only the standard modules that a spec uses", () => {
    const getSpec = (isAppending: boolean) =>
      defineSpec((tla) => {
        const head = tla.variable("Head");
        return {
          init: head.eq(isAppending ? tla.tuple().append(1) : 0),
          next: head.prime().eq(head),
        };
      });
    expect(check({ spec: getSpec(false) }).status).toBe("success");
    expect(() => check({ spec: getSpec(true) })).toThrow(TlaSyntaxError);
  });

  it("rejects parameters that shadow a declared name", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const increment = tla.operator("Increment", ["x"], (value) => value.plus(1));
      return { init: x.eq(0), next: x.prime().eq(increment(x)) };
    });
    expect(() => check({ spec })).toThrow(TlaSyntaxError);
  });

  it("passes operators to operator parameters", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const twice = tla.operator("Twice", ["F(_)", "value"], (apply, value) => apply(apply(value)));
      const increment = tla.operator("Increment", ["value"], (value) => value.plus(1));
      return {
        init: x.eq(0),
        next: tla.and(x.lt(4), x.prime().eq(twice(increment, x))),
        invariants: {
          Small: tla.letOperator(
            ["value"],
            (value) => value.times(2),
            (double) => double(x).lt(10),
          ),
        },
        checkDeadlock: false,
      };
    });
    expect(getCounts({ spec })).toEqual(["success", 3, 3, 3]);
  });

  it("evaluates recursive LET operators", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      return {
        init: x.eq(0),
        next: tla.and(x.lt(10), x.prime().eq(x.plus(1))),
        invariants: {
          Small: tla.letOperator(
            ["n"],
            (n, sum) => tla.ifThenElse(n.eq(0), 0, n.plus(sum(n.minus(1)))),
            (sum) => sum(x).lt(10),
          ),
        },
      };
    });
    const result = check({ spec });
    expect(result.violation?.name).toBe("Small");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([5, 5, 5]);
  });

  it("evaluates recursive function definitions", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const fibonacci = tla.function("Fibonacci", tla.range(0, 10), (n): Term =>
        tla.ifThenElse(n.lt(2), n, fibonacci.at(n.minus(1)).plus(fibonacci.at(n.minus(2)))),
      );
      return {
        init: x.eq(0),
        next: tla.and(x.lt(10), x.prime().eq(x.plus(1))),
        invariants: { Small: fibonacci.at(x).lt(5) },
      };
    });
    const result = check({ spec });
    expect(result.violation?.name).toBe("Small");
    expect([result.generatedStates, result.distinctStates, result.depth]).toEqual([6, 6, 6]);
  });

  it("evaluates the Bags module", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      const bag = tla.set("a", "b").setToBag().bagAdd(tla.set("a").setToBag());
      return {
        init: x.eq(0),
        next: x.prime().eq(x),
        assumptions: {
          Counts: tla.and(
            tla.value("a").copiesIn(bag).eq(2),
            bag.bagCardinality().eq(3),
            bag.bagSubtract(tla.set("a").setToBag()).eq(tla.set("a", "b").setToBag()),
            tla.EmptyBag.isSubBagOf(bag),
            bag.bagToSet().eq(tla.set("a", "b")),
            bag.bagOfAll((element) => element).eq(bag),
            tla.set(bag, tla.EmptyBag).bagUnion().eq(bag),
            bag.subBags().cardinality().eq(6),
          ),
        },
      };
    });
    expect(check({ spec }).status).toBe("success");
  });

  it("evaluates the Reals module like TLC", () => {
    const getSpec = (value: number) =>
      defineSpec((tla) => {
        const x = tla.variable("x");
        return {
          init: x.eq(value),
          next: x.prime().eq(x),
          assumptions: { RealIsAString: tla.Real.eq("Reals") },
        };
      });
    expect(check({ spec: getSpec(1) }).status).toBe("success");
    expect(() => check({ spec: getSpec(1.5) })).toThrow(/TLC can't handle real numbers: 1\.5/);
  });

  it("reports a false assumption", () => {
    const spec = defineSpec((tla) => {
      const limit = tla.constant("Limit", 3);
      const x = tla.variable("x");
      return {
        init: x.eq(0),
        next: x.prime().eq(x),
        assumptions: { LimitIsLarge: limit.gt(5) },
      };
    });
    const result = check({ spec });
    expect([result.status, result.violation?.name]).toEqual([
      "assumption-violation",
      "LimitIsLarge",
    ]);
  });

  it("checks the arity of binders and operators at compile time", () => {
    defineSpec((tla) => {
      const x = tla.variable("x");
      const add = tla.operator("Add", ["left", "right"], (left, right) => left.plus(right));
      const twice = tla.operator("Twice", ["F(_)", "value"], (apply, value) => apply(apply(value)));
      return {
        // @ts-expect-error A single set binds one variable.
        init: tla.exists(tla.range(0, 1), (left, right) => x.eq(left.plus(right))),
        next: tla.and(
          // @ts-expect-error Add takes two arguments.
          x.prime().eq(add(x)),
          // @ts-expect-error F(_) takes an operator, not a number.
          x.prime().eq(twice(1, x)),
        ),
      };
    });
  });

  it("reports 32-bit overflow like TLC", () => {
    const spec = defineSpec((tla) => {
      const x = tla.variable("x");
      return { init: x.eq(2147483647), next: x.prime().eq(x.plus(1)) };
    });
    expect(() => check({ spec })).toThrow(TlaEvaluationError);
  });
});
