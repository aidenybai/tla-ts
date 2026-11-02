// A conflict-driven clause learning SAT solver for the clauses of one tableau node. A literal is a
// variable number, negated when below zero. The solver keeps what it learns across calls, which add
// clauses or assume literals. It decides each open variable false first, so a model sets few
// variables, and a model holds 1 for each true variable and -1 for each false one. It gives up at
// the first conflict after isExpired turns true.

const getIndex = (literal: number) => (literal > 0 ? 2 * literal : -2 * literal + 1);

export const createSolver = (variableCount: number, isExpired: () => boolean) => {
  const values = new Int8Array(variableCount + 1);
  const levels = new Int32Array(variableCount + 1);
  const reasons = Array.from<number[] | undefined>({ length: variableCount + 1 });
  const activities = new Float64Array(variableCount + 1);
  const seen = new Uint8Array(variableCount + 1);
  const watches: number[][][] = Array.from({ length: 2 * variableCount + 2 }, () => []);
  const trail: number[] = [];
  const levelStarts: number[] = [];
  const state = { head: 0, bump: 1, isUnsatisfiable: false };
  const getValue = (literal: number) => (literal > 0 ? values[literal] : -values[-literal]);
  const assign = (literal: number, reason: number[] | undefined) => {
    const variable = Math.abs(literal);
    values[variable] = literal > 0 ? 1 : -1;
    levels[variable] = levelStarts.length;
    reasons[variable] = reason;
    trail.push(literal);
  };
  const watch = (clause: number[]) => {
    watches[getIndex(clause[0])].push(clause);
    watches[getIndex(clause[1])].push(clause);
  };
  // Moves each watch off a literal that turned false, and returns the clause of a conflict. The
  // literal a clause implies sits first in it.
  const propagate = () => {
    for (; state.head < trail.length; state.head++) {
      const falsified = -trail[state.head];
      const watching = watches[getIndex(falsified)];
      for (let position = 0; position < watching.length; position++) {
        const clause = watching[position];
        if (clause[0] === falsified) [clause[0], clause[1]] = [clause[1], clause[0]];
        if (getValue(clause[0]) > 0) continue;
        const replacement = clause.findIndex(
          (literal, index) => index > 1 && getValue(literal) >= 0,
        );
        if (replacement !== -1) {
          [clause[1], clause[replacement]] = [clause[replacement], clause[1]];
          watches[getIndex(clause[1])].push(clause);
          watching[position--] = watching[watching.length - 1];
          watching.pop();
          continue;
        }
        if (getValue(clause[0]) < 0) return clause;
        assign(clause[0], clause);
      }
    }
    return undefined;
  };
  const backtrack = (level: number) => {
    if (level >= levelStarts.length) return;
    const size = levelStarts[level];
    while (trail.length > size) values[Math.abs(trail.pop() ?? 0)] = 0;
    levelStarts.length = level;
    state.head = trail.length;
  };
  // Resolves the conflict back to the first literal of the current level that all its paths pass
  // through, and returns the learned clause with that literal first.
  const analyze = (conflict: number[]) => {
    const learned = [0];
    const current = levelStarts.length;
    const walk = { pending: 0, literal: 0, index: trail.length - 1 };
    for (let clause: number[] | undefined = conflict; ;) {
      for (const literal of clause?.slice(walk.literal === 0 ? 0 : 1) ?? []) {
        const variable = Math.abs(literal);
        if (seen[variable] || levels[variable] === 0) continue;
        seen[variable] = 1;
        activities[variable] += state.bump;
        if (levels[variable] === current) walk.pending++;
        else learned.push(literal);
      }
      while (!seen[Math.abs(trail[walk.index])]) walk.index--;
      walk.literal = trail[walk.index--];
      seen[Math.abs(walk.literal)] = 0;
      clause = reasons[Math.abs(walk.literal)];
      if (--walk.pending === 0) break;
    }
    learned[0] = -walk.literal;
    learned.forEach((literal) => (seen[Math.abs(literal)] = 0));
    state.bump *= 1.05;
    return learned;
  };
  // Literals false for good are dropped, since the solver adds clauses only at level 0.
  const addClause = (clause: number[]) => {
    backtrack(0);
    const literals = [...new Set(clause)];
    if (state.isUnsatisfiable || literals.some((literal) => getValue(literal) > 0)) return;
    if (literals.some((literal) => literals.includes(-literal))) return;
    const open = literals.filter((literal) => getValue(literal) === 0);
    if (open.length > 1) {
      watch(open);
      return;
    }
    if (open.length === 0) {
      state.isUnsatisfiable = true;
      return;
    }
    assign(open[0], undefined);
    if (propagate()) state.isUnsatisfiable = true;
  };
  // A model of the clauses in which every assumed literal holds, or unsat when there is none.
  const solve = (assumptions: number[]): Int8Array | "unsat" | "unknown" => {
    backtrack(0);
    if (state.isUnsatisfiable) return "unsat";
    for (;;) {
      const conflict = propagate();
      if (conflict) {
        if (levelStarts.length === 0) {
          state.isUnsatisfiable = true;
          return "unsat";
        }
        if (isExpired()) return "unknown";
        const learned = analyze(conflict);
        const deepest = learned
          .slice(1)
          .reduce(
            (best, literal, index) =>
              levels[Math.abs(literal)] > levels[Math.abs(learned[best])] ? index + 1 : best,
            1,
          );
        if (learned.length > 1) [learned[1], learned[deepest]] = [learned[deepest], learned[1]];
        backtrack(learned.length === 1 ? 0 : levels[Math.abs(learned[1])]);
        if (learned.length > 1) watch(learned);
        assign(learned[0], learned.length > 1 ? learned : undefined);
        continue;
      }
      const assumption = assumptions.find((literal) => getValue(literal) <= 0);
      if (assumption !== undefined && getValue(assumption) < 0) return "unsat";
      const decision =
        assumption ??
        -values.reduce(
          (best, value, variable) =>
            variable > 0 && value === 0 && (best === 0 || activities[variable] > activities[best])
              ? variable
              : best,
          0,
        );
      if (decision === 0) return Int8Array.from(values);
      levelStarts.push(trail.length);
      assign(decision, undefined);
    }
  };
  return { addClause, solve };
};
