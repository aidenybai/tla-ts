import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { L_FALSE } from "../../src/prove/smt/solver/lbool";
import {
  type ConstraintKind,
  KIND_EQ,
  KIND_GE,
  KIND_LE,
} from "../../src/prove/smt/solver/lp/constraints";
import { LarSolver } from "../../src/prove/smt/solver/lp/lar-solver";
import { NlaCore } from "../../src/prove/smt/solver/lp/nla-core";
import { NraSolver } from "../../src/prove/smt/solver/lp/nra-solver";
import { AlgebraicManager, Anum } from "../../src/prove/smt/solver/nlsat/algebraic";
import { Evaluator } from "../../src/prove/smt/solver/nlsat/evaluator";
import type { IntervalSet } from "../../src/prove/smt/solver/nlsat/interval-set";
import { getSingleCell } from "../../src/prove/smt/solver/nlsat/levelwise";
import { Mpbq } from "../../src/prove/smt/solver/nlsat/mpbq";
import type { Atom, IneqKind, RootKind } from "../../src/prove/smt/solver/nlsat/types";
import { NlsatSolver } from "../../src/prove/smt/solver/nlsat/solver";
import { UpolynomialManager } from "../../src/prove/smt/solver/nlsat/upolynomial";
import {
  DEFAULT_FACTOR_PARAMS,
  factorUpolynomial,
} from "../../src/prove/smt/solver/nlsat/upolynomial-factorization";
import { Rational } from "../../src/prove/smt/solver/rational";
import {
  type Polynomial,
  PolynomialCache,
  PolynomialManager,
} from "../../src/prove/smt/solver/nlsat/polynomial";

const FIXTURES = join(__dirname, "../fixtures/nlsat");

// The harness syntax: terms separated by spaces, each coeff:var^degree,var^degree.
const parsePolynomial = (pm: PolynomialManager, text: string) => {
  const terms = text.trim() === "" ? [] : text.trim().split(/\s+/);
  const as = terms.map((term) => BigInt(term.slice(0, term.indexOf(":"))));
  const ms = terms.map((term) => {
    const powers = term
      .slice(term.indexOf(":") + 1)
      .split(",")
      .filter((power) => power !== "")
      .map((power) => power.split("^").map(Number));
    return pm.mkMonomial(
      powers.map((power) => power[0]),
      powers.map((power) => power[1]),
    );
  });
  return pm.mkPolynomial(as, ms);
};

// Prints the monomials in the polynomial's own order, as the harness does.
const showPolynomial = (polynomial: Polynomial) =>
  `[${polynomial.ms
    .map(
      (monomial, index) =>
        `${polynomial.as[index]}:${monomial.vars.map((variable, power) => `${variable}^${monomial.degrees[power]}`).join(",")}`,
    )
    .join(" ")}]`;

const runPolynomialCommand = (input: string) => {
  const pm = new PolynomialManager();
  const cache = new PolynomialCache(pm);
  const command = input.slice(0, input.indexOf(" "));
  const rest = input.slice(command.length + 1);
  if (command === "factor") {
    const factors = cache.factor(parsePolynomial(pm, rest));
    return `factors${factors.map((factor) => ` ${showPolynomial(factor)}`).join("")}`;
  }
  if (command === "psc") {
    const variable = Number(rest.slice(0, rest.indexOf(" ")));
    const operands = rest.slice(rest.indexOf(" ") + 1).split(" ; ");
    const chain = cache.pscChain(
      parsePolynomial(pm, operands[0]),
      parsePolynomial(pm, operands[1]),
      variable,
    );
    return `psc${chain.map((element) => ` ${showPolynomial(element)}`).join("")}`;
  }
  const operands = rest.split(" ; ");
  return `gcd ${showPolynomial(pm.gcd(parsePolynomial(pm, operands[0]), parsePolynomial(pm, operands[1])))}`;
};

describe("nlsat polynomials", () => {
  // Random polynomials of degree 2 or less, with the factors, subresultants and gcds that Z3's
  // polynomial manager computes for them, monomial order included.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "polynomial.json"), "utf8"),
  );

  it.each(cases)("%s", (input, expected) => {
    expect(runPolynomialCommand(input)).toBe(expected);
  });

  it("returns 1 for coprime primitive polynomials, where Z3's modular gcd returns 2", () => {
    expect(runPolynomialCommand("gcd 2:0^1 -3: ; 2:0^1 -1:")).toBe("gcd [1:]");
  });

  it("computes the subresultants of a polynomial of degree 2 as Z3 does", () => {
    expect(runPolynomialCommand("psc 0 1:0^2 -2: ; 1:0^1 -1:")).toBe("psc [-1:]");
  });
});

const parseRational = (text: string) => {
  const parts = text.split("/");
  return Rational.of(BigInt(parts[0]), BigInt(parts[1] ?? "1"));
};

// The harness commands: select a b, and closest x s n v0 ... v(n-1) poly, which leaves x unassigned.
const runAlgebraicCommand = (input: string) => {
  const words = input.split(" ");
  const am = new AlgebraicManager();
  if (words[0] === "select")
    return `select ${am.select(new Anum(parseRational(words[1])), new Anum(parseRational(words[2]))).value}`;
  const variable = Number(words[1]);
  const count = Number(words[3]);
  const sample = words
    .slice(4, 4 + count)
    .map((word, index) => (index === variable ? undefined : new Anum(parseRational(word))));
  const pm = new PolynomialManager();
  const polynomial = parsePolynomial(pm, words.slice(4 + count).join(" "));
  const closest = am.isolateRootsClosest(pm, polynomial, sample, parseRational(words[2]));
  const show = (root: Anum) => (root.value instanceof Rational ? `${root.value}` : "irrational");
  return `closest${closest.roots.map((root, index) => ` ${closest.indices[index]}@${show(root)}`).join("")}`;
};

// The harness's an programs: registers of real algebraic numbers, one command per line, each
// printing its result, the numbers it refined, and roots as polynomial, index and interval.
const runAnumProgram = (program: string) => {
  const am = new AlgebraicManager();
  const pm = new PolynomialManager();
  const registers: Anum[] = [];
  const getRegister = (index: number) => {
    while (registers.length <= index) registers.push(new Anum(Rational.zero));
    return registers[index];
  };
  const show = (anum: Anum) => {
    if (anum.value instanceof Rational) return ` q${anum.value}`;
    const index = am.getRootIndex(anum);
    return ` r[${anum.value.p.join(" ")}]#${index}(${anum.value.lower},${anum.value.upper})`;
  };
  const runCommand = (words: string[]) => {
    const numbers = words.slice(1, 4).map(Number);
    switch (words[0]) {
      case "q":
        registers[numbers[0]] = new Anum(parseRational(words[2]));
        return show(registers[numbers[0]]);
      case "root": {
        const roots = am.isolateRoots(pm, pm.fromCoeffs(words.slice(3).map(BigInt), 0), []);
        if (numbers[1] > roots.length) return " error";
        getRegister(numbers[0]);
        registers[numbers[0]] = roots[numbers[1] - 1];
        return show(registers[numbers[0]]);
      }
      case "add":
      case "mul":
      case "div":
      case "sel": {
        const first = getRegister(numbers[1]);
        const second = getRegister(numbers[2]);
        if (words[0] === "div" && am.isZero(second)) return " error";
        const result =
          words[0] === "add"
            ? am.add(first, second)
            : words[0] === "mul"
              ? am.mul(first, second)
              : words[0] === "div"
                ? am.div(first, second)
                : am.select(first, second);
        getRegister(numbers[0]);
        registers[numbers[0]] = am.copy(result);
        return show(registers[numbers[0]]);
      }
      case "pow":
      case "intlt":
      case "intgt": {
        const anum = getRegister(numbers[1]);
        const result =
          words[0] === "pow"
            ? am.power(anum, numbers[2])
            : words[0] === "intlt"
              ? am.intLt(anum)
              : am.intGt(anum);
        getRegister(numbers[0]);
        registers[numbers[0]] = am.copy(result);
        return show(registers[numbers[0]]);
      }
      case "neg":
        am.neg(getRegister(numbers[0]));
        return show(registers[numbers[0]]);
      case "inv":
        if (am.isZero(getRegister(numbers[0]))) return " error";
        am.inv(registers[numbers[0]]);
        return show(registers[numbers[0]]);
      case "cmp": {
        const first = getRegister(numbers[0]);
        const second = getRegister(numbers[1]);
        return ` ${am.compare(first, second)}${show(first)}${show(second)}`;
      }
      case "isint":
      case "israt": {
        const anum = getRegister(numbers[0]);
        return `${showFlag(words[0] === "isint" ? am.isInt(anum) : am.isRational(anum))}${show(anum)}`;
      }
      case "show":
        return show(getRegister(numbers[0]));
      default: {
        const rest = words[0] === "closest" ? words.slice(2) : words.slice(1);
        const separator = rest.indexOf(";");
        const polynomial = parsePolynomial(pm, rest.slice(0, separator).join(" "));
        const bindings = rest.slice(separator + 1).map((word) => word.split("=").map(Number));
        const values: Anum[] = [];
        for (const binding of bindings) values[binding[0]] = am.copy(getRegister(binding[1]));
        let output = "";
        let roots: Anum[] = [];
        if (words[0] === "sign") output = ` ${am.evalSignAt(pm, polynomial, values)}`;
        else if (words[0] === "iso") {
          roots = am.isolateRoots(pm, polynomial, values);
          output = ` roots${roots.map(show).join("")}`;
        } else if (words[0] === "closest") {
          const closest = am.isolateRootsClosest(pm, polynomial, values, parseRational(words[1]));
          roots = closest.roots;
          output = ` roots${roots.map(show).join("")} idx${closest.indices.map((index) => ` ${index}`).join("")}`;
        } else {
          const signed = am.isolateRootsWithSigns(pm, polynomial, values);
          roots = signed.roots;
          output = ` roots${roots.map(show).join("")} signs${signed.signs.map((sign) => ` ${sign}`).join("")}`;
        }
        // The roots go to registers 8 and up, for later commands.
        roots.forEach((root, index) => {
          getRegister(8 + index);
          registers[8 + index] = am.copy(root);
        });
        output += " after";
        for (const binding of bindings) {
          registers[binding[1]] = am.copy(values[binding[0]]);
          output += show(registers[binding[1]]);
        }
        return output;
      }
    }
  };
  return program
    .split("\n")
    .map((line) => `${line.split(" ")[0]}${runCommand(line.split(" "))}`)
    .join("\n");
};

describe("nlsat real algebraic numbers", () => {
  // Random programs over roots of univariate polynomials and rationals: arithmetic, comparison,
  // integrality, sample selection, and the roots and signs of polynomials at algebraic points.
  // Each line prints Z3's result and the intervals its refinements left behind.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "algebraic-numbers.json"), "utf8"),
  );

  it.each(cases)("%s", (program, expected) => {
    expect(runAnumProgram(program)).toBe(expected);
  });
});

// Rebuilds an atom from the harness's print of it: the solver normalizes atoms, which is not
// the evaluator's job.
const parseAtom = (pm: PolynomialManager, text: string): Atom => {
  const words = text.trim().split(" ");
  const boolVar = Number(words[0].slice(1));
  const maxVar = Number(words[2]);
  const factors = [...text.matchAll(/([eoi]\d*) ?\[([^\]]*)\]/g)];
  if (words[1].startsWith("ROOT"))
    return {
      kind: words[1] as RootKind,
      boolVar,
      maxVar,
      index: Number(factors[0][1].slice(1)),
      polynomial: parsePolynomial(pm, factors[0][2]),
    };
  return {
    kind: words[1] as IneqKind,
    boolVar,
    maxVar,
    polynomials: factors.map((factor) => parsePolynomial(pm, factor[2])),
    isEven: factors.map((factor) => factor[1] === "e"),
  };
};

// The harness's ev programs: an assignment of real algebraic numbers, atoms over it, the
// infeasible intervals of their literals, unions of those, and samples picked outside them. Each
// line prints the sets with their exact bounds and the assignment its refinements left behind.
const runEvaluatorProgram = (program: string, expected: string) => {
  const am = new AlgebraicManager();
  const pm = new PolynomialManager();
  const assignment: (Anum | undefined)[] = [];
  const evaluator = new Evaluator(pm, am, assignment);
  const registers: Anum[] = [];
  const sets: (IntervalSet | null)[] = [];
  const atoms: Atom[] = [];
  const clause = { id: 0, literals: [], isLearned: false };
  const expectedLines = expected.split("\n");
  let variableCount = 0;
  const show = (anum: Anum) => {
    if (anum.value instanceof Rational) return ` q${anum.value}`;
    const index = am.getRootIndex(anum);
    return ` r[${anum.value.p.join(" ")}]#${index}(${anum.value.lower},${anum.value.upper})`;
  };
  const showSet = (set: IntervalSet | null | undefined) => {
    if (set === null || set === undefined) return " {}";
    const intervals = set.intervals.map(
      (interval) =>
        ` ${interval.isLowerOpen ? "(" : "["}${interval.lower === null ? " -oo" : show(interval.lower)} ,` +
        `${interval.upper === null ? " +oo" : show(interval.upper)} ${interval.isUpperOpen ? ")" : "]"}` +
        `j${interval.justification}${interval.clause === null ? "" : "c"}`,
    );
    return ` {${set.isFull ? "full" : "part"}${intervals.join("")} }`;
  };
  const showAssignment = () =>
    ` after${Array.from({ length: variableCount }, (_, variable) => {
      const value = assignment[variable];
      return value === undefined ? " _" : show(value);
    }).join("")}`;
  const runCommand = (words: string[], index: number) => {
    const numbers = words.slice(1).map(Number);
    switch (words[0]) {
      case "vars":
        variableCount = numbers[0];
        return "";
      case "seed":
        evaluator.ism.setSeed(numbers[0]);
        return "";
      case "q":
        registers[numbers[0]] = new Anum(parseRational(words[2]));
        return show(registers[numbers[0]]);
      case "root": {
        const coeffs = words.slice(3).map(BigInt);
        while (coeffs[coeffs.length - 1] === 0n) coeffs.pop();
        registers[numbers[0]] = am.isolateRoots(pm, pm.fromCoeffs(coeffs, 0), [])[numbers[1] - 1];
        return show(registers[numbers[0]]);
      }
      case "set":
        // An unset register, such as 7 when every pick met a full set, is zero.
        assignment[numbers[0]] = am.copy(registers[numbers[1]] ?? new Anum(Rational.zero));
        return "";
      case "ineq":
      case "rootatom": {
        const printed = expectedLines[index].slice(words[0].length);
        atoms.push(parseAtom(pm, printed));
        return printed;
      }
      case "eval": {
        const atom = atoms[numbers[0]];
        if (assignment[atom.maxVar] === undefined) return " unassigned";
        return `${showFlag(evaluator.eval(atom, numbers[1] === 1))}${showAssignment()}`;
      }
      case "inf":
        sets[numbers[0]] = evaluator.infeasibleIntervals(
          atoms[numbers[1]],
          numbers[2] === 1,
          numbers[3] === 1 ? clause : null,
        );
        return `${showSet(sets[numbers[0]])}${showAssignment()}`;
      case "union": {
        const union = evaluator.ism.mkUnion(sets[numbers[1]] ?? null, sets[numbers[2]] ?? null);
        const output = `${showSet(union)}${showSet(sets[numbers[1]])}${showSet(sets[numbers[2]])}`;
        sets[numbers[0]] = union;
        return output;
      }
      case "subset":
        return `${showFlag(evaluator.ism.subset(sets[numbers[0]] ?? null, sets[numbers[1]] ?? null))}${showSet(sets[numbers[0]])}${showSet(sets[numbers[1]])}`;
      case "full":
        return showFlag(evaluator.ism.isFull(sets[numbers[0]] ?? null));
      case "just": {
        const justifications = evaluator.ism.getJustifications(sets[numbers[0]] ?? null);
        return `${justifications.literals.map((literal) => ` ${literal}`).join("")} clauses ${justifications.clauses.length}`;
      }
      case "pick": {
        const set = sets[numbers[0]] ?? null;
        if (evaluator.ism.isFull(set)) return " fullset";
        // The picked number goes to register 7, for a later set.
        registers[7] = evaluator.ism.pickInComplement(set, numbers[2] === 1);
        return `${show(registers[7])}${showSet(set)}`;
      }
      case "pickmax": {
        const max = evaluator.ism.pickMaxInComplement(sets[numbers[0]] ?? null);
        return `${max === null ? " 0" : ` 1${show(max)}`}${showSet(sets[numbers[0]])}`;
      }
      default: {
        const max = evaluator.ism.queryMaxInComplement(sets[numbers[0]] ?? null);
        return `${max === null ? " 0" : ` 1${show(max.sup)}${showFlag(max.isAttained)}`}${showSet(sets[numbers[0]])}`;
      }
    }
  };
  return program
    .split("\n")
    .map((line, index) => `${line.split(" ")[0]}${runCommand(line.split(" "), index)}`)
    .join("\n");
};

// The harness's lw programs: a sample of rationals and roots, then the cell intervals of the
// levelwise single cell construction around it, and the sample its refinements left behind.
const runLevelwiseProgram = (program: string) => {
  const am = new AlgebraicManager();
  const pm = new PolynomialManager();
  const cache = new PolynomialCache(pm);
  const sample: Anum[] = [];
  const registers: Anum[] = [];
  let variableCount = 0;
  const show = (anum: Anum) => {
    if (anum.value instanceof Rational) return ` q${anum.value}`;
    const index = am.getRootIndex(anum);
    return ` r[${anum.value.p.join(" ")}]#${index}(${anum.value.lower},${anum.value.upper})`;
  };
  const showBound = (polynomial: Polynomial | null, index: number, infinity: string) =>
    polynomial === null ? infinity : `${showPolynomial(polynomial)}#${index}`;
  const runCommand = (words: string[]) => {
    const numbers = words.slice(1).map(Number);
    switch (words[0]) {
      case "vars":
        variableCount = numbers[0];
        return "";
      case "q":
        registers[numbers[0]] = new Anum(parseRational(words[2]));
        return show(registers[numbers[0]]);
      case "root":
        registers[numbers[0]] = am.isolateRoots(
          pm,
          pm.fromCoeffs(words.slice(3).map(BigInt), 0),
          [],
        )[numbers[1] - 1];
        return show(registers[numbers[0]]);
      case "set":
        sample[numbers[0]] = am.copy(registers[numbers[1]]);
        return "";
      default: {
        const polynomials = words
          .slice(3)
          .join(" ")
          .split(" ; ")
          .map((text) => parsePolynomial(pm, text));
        const cell = getSingleCell(
          pm,
          am,
          cache,
          polynomials,
          numbers[0],
          sample,
          numbers[1] === 1,
        );
        const intervals = cell.map((interval) =>
          interval.isSection
            ? ` S${showBound(interval.lower, interval.lowerIndex, "")}`
            : ` (${showBound(interval.lower, interval.lowerIndex, "-oo")},${showBound(interval.upper, interval.upperIndex, "+oo")})`,
        );
        const values = Array.from({ length: variableCount }, (_, variable) =>
          sample[variable] === undefined ? " _" : show(sample[variable]),
        );
        return `${intervals.join("")} after${values.join("")}`;
      }
    }
  };
  return program
    .split("\n")
    .map((line) => `${line.split(" ")[0]}${runCommand(line.split(" "))}`)
    .join("\n");
};

describe("nlsat levelwise", () => {
  // Random samples and polynomials, around the top variable left unassigned or, in the linear
  // mode of check_assignment, every variable assigned. The last cases have four polynomials with
  // roots on both sides of the sample, which take the spanning tree heuristic. Cases where Z3
  // breaks a tie between equal roots by its recycled polynomial ids are left out, see levelwise.ts.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "levelwise.json"), "utf8"),
  );

  it.each(cases)("%s", (program, expected) => {
    expect(runLevelwiseProgram(program)).toBe(expected);
  });
});

describe("nlsat evaluator", () => {
  // Random programs with two or three variables, the top one unassigned until the end, as when
  // nlsat decides it. Unions drop the clauses of the intervals they copy, as Z3's do.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "evaluator.json"), "utf8"),
  );

  it.each(cases)("%s", (program, expected) => {
    expect(runEvaluatorProgram(program, expected)).toBe(expected);
  });
});

describe("nlsat polynomial factorization", () => {
  // Products of random factors in two or three variables, up to degree 2 in each variable per
  // factor, factored as Z3 does: univariate factorization, the square root of a discriminant, and
  // bivariate Hensel lifting at evaluation points, monomial order included.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "polynomial-factorization.json"), "utf8"),
  );

  it.each(cases)("%s", (input, expected) => {
    expect(runPolynomialCommand(input)).toBe(expected);
  });
});

describe("nlsat algebraic numbers", () => {
  // Random rational intervals and polynomials of degree 1 in the root variable, with the numbers
  // that Z3's algebraic number manager selects and isolates for them.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "algebraic.json"), "utf8"),
  );

  it.each(cases)("%s", (input, expected) => {
    expect(runAlgebraicCommand(input)).toBe(expected);
  });

  it("isolates the irrational roots closest to the sample", () => {
    expect(runAlgebraicCommand("closest 1 3 2 2 0 1:1^2 -2:")).toBe("closest 2@irrational");
  });
});
const showCoeffs = (coeffs: readonly bigint[]) => ` [${coeffs.join(" ")}]`;

const showFlag = (isTrue: boolean) => ` ${isTrue ? 1 : 0}`;

// Isolates the roots of the square-free part, then makes each interval refinable, refines it to
// width 1/2^20, and reports the root's index and the interval normalized around zero.
const showIsolation = (um: UpolynomialManager, coeffs: readonly bigint[]) => {
  const squareFree = um.squareFree(coeffs);
  const isolated = um.sqfIsolateRoots(squareFree);
  const refined = isolated.lowers.map((lower, index) => {
    const refinable = um.isolating2refinable(squareFree, lower, isolated.uppers[index]);
    if (!refinable.isInterval) return ` root ${refinable.lower}`;
    const result = um.refineToPrecision(squareFree, refinable.lower, refinable.upper, 20);
    const rootId = um.getRootId(squareFree, result.lower);
    if (!result.isInterval)
      return ` int ${refinable.lower} ${refinable.upper} proot ${result.lower} id${rootId}`;
    const signLower = um.evalSignAtBq(squareFree, result.lower);
    const normalized = um.normalizeInterval(squareFree, result.lower, result.upper, signLower);
    const shownNormalized =
      normalized === null
        ? ` n0 ${result.lower} ${result.upper}`
        : ` n1 ${normalized.lower} ${normalized.upper}`;
    return ` int ${refinable.lower} ${refinable.upper} p ${result.lower} ${result.upper} id${rootId}${shownNormalized}`;
  });
  return `${showCoeffs(squareFree)} roots${isolated.roots.map((root) => ` ${root}`).join("")} intervals${isolated.lowers.map((lower, index) => ` ${lower} ${isolated.uppers[index]}`).join("")} refined${refined.join("")}`;
};

// The harness commands: <op> <coefficients from the constant term up> [; <operand>]. The ops
// starting with z take a prime first and run over Z_p.
const runUpolynomialCommand = (input: string) => {
  const words = input.split(" ");
  const op = words[0];
  const isModular = op.startsWith("z");
  const operands = words
    .slice(isModular ? 2 : 1)
    .join(" ")
    .split(" ; ")
    .map((operand) => (operand === "" ? [] : operand.split(" ")));
  const um = new UpolynomialManager();
  const toCoeffs = (operand: string[]) => um.set(operand.map(BigInt));
  const first = toCoeffs(operands[0]);
  if (isModular)
    return `${op}${um.withZp(BigInt(words[1]), () => {
      const x = um.set(first);
      const y = um.set(toCoeffs(operands[1]));
      if (op === "zgcd") return showCoeffs(um.gcd(x, y));
      if (op === "zextgcd") {
        const result = um.extGcd(x, y);
        return showCoeffs(result.u) + showCoeffs(result.v) + showCoeffs(result.d);
      }
      if (op === "zdivrem") {
        const division = um.divRem(x, y);
        return showCoeffs(division.quotient) + showCoeffs(division.remainder);
      }
      if (op === "zsqf") return showCoeffs(um.squareFree(x));
      if (op === "zsqfp") return showFlag(um.isSquareFree(x));
      if (op === "zmonic") return showCoeffs(um.mkMonic(x));
      if (op === "zdivides") return showFlag(um.divides(x, y));
      if (op === "zmul") return showCoeffs(um.mul(x, y));
      const exact = um.exactDiv(x, y);
      return exact === null ? " 0" : ` 1${showCoeffs(exact)}`;
    })}`;
  const second = operands[1] ?? [];
  if (op === "isolate") return `isolate${showIsolation(um, first)}`;
  if (op === "gcd") return `gcd${showCoeffs(um.gcd(first, toCoeffs(second)))}`;
  if (op === "divrem") {
    const division = um.divRem(first, toCoeffs(second));
    return `divrem ${division.power}${showCoeffs(division.quotient)}${showCoeffs(division.remainder)}`;
  }
  if (op === "srem") return `srem${showCoeffs(um.srem(first, toCoeffs(second)))}`;
  if (op === "exact") {
    const exact = um.exactDiv(first, toCoeffs(second));
    return exact === null ? "exact 0" : `exact 1${showCoeffs(exact)}`;
  }
  if (op === "divides") return `divides${showFlag(um.divides(first, toCoeffs(second)))}`;
  if (op === "sqf") return `sqf${showCoeffs(um.squareFree(first))}`;
  if (op === "sqfp") return `sqfp${showFlag(um.isSquareFree(first))}`;
  if (op === "sturm") return `sturm${um.sturmSeq(first).map(showCoeffs).join("")}`;
  if (op === "tarski")
    return `tarski${um.sturmTarskiSeq(first, toCoeffs(second)).map(showCoeffs).join("")}`;
  if (op === "q2bq") {
    const result = um.convertQ2bqInterval(
      first,
      parseRational(second[0]),
      parseRational(second[1]),
    );
    return result.isInterval ? `q2bq 1 ${result.lower} ${result.upper}` : `q2bq 0 ${result.lower}`;
  }
  if (op === "knuth")
    return `knuth ${um.knuthPositiveRootUpperBound(first)} ${um.knuthNegativeRootUpperBound(first)} ${um.nonzeroRootLowerBound(first)}`;
  if (op === "flips")
    return `flips${showCoeffs(um.pMinusX(first))}${showCoeffs(um.p1DivX(first))}${showCoeffs(um.removeZeroRoots(first))}`;
  if (op === "transq") return `transq${showCoeffs(um.translateQ(first, parseRational(second[0])))}`;
  if (op === "compq") return `compq${showCoeffs(um.composePQX(first, parseRational(second[0])))}`;
  if (op === "signq") return `signq ${um.evalSignAtQ(first, parseRational(second[0]))}`;
  if (op === "signbq")
    return `signbq ${um.evalSignAtBq(first, Mpbq.of(BigInt(second[0]), Number(second[1])))}`;
  return `pw${showCoeffs(um.pw(first, Number(second[0])))}`;
};

// factor <coefficients> with polynomial::factor_params(), afactor with the algebraic number
// module's limits.
const runFactorCommand = (input: string) => {
  const words = input.split(" ");
  const um = new UpolynomialManager();
  const params =
    words[0] === "afactor"
      ? { maxPrime: 31, primeTrials: 1, maxSearchSize: 5000 }
      : DEFAULT_FACTOR_PARAMS;
  const result = factorUpolynomial(um, um.set(words.slice(1).map(BigInt)), params);
  const factors = result.factors.factors.map(
    (factor, index) => `${showCoeffs(factor)}^${result.factors.degrees[index]}`,
  );
  return `${words[0]} ${result.isComplete ? 1 : 0} ${result.factors.constant}${factors.join("")}`;
};

describe("nlsat univariate factorization", () => {
  // Products of random factors up to degree 15, some with Swinnerton-Dyer style polynomials such
  // as x^4 - 10x^2 + 1 that split modulo every prime, factored as Z3 does: Berlekamp in Z_p,
  // Hensel lifting and the search over combinations of lifted factors.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "upolynomial-factorization.json"), "utf8"),
  );

  it.each(cases)("%s", (input, expected) => {
    expect(runFactorCommand(input)).toBe(expected);
  });
});

describe("nlsat univariate polynomials", () => {
  // Products of random factors up to degree 3, so with repeated, rational and irrational roots, and
  // what Z3's upolynomial manager computes for them: root isolation and refinement, gcds over Z and
  // Z_p, pseudo-division, Sturm sequences and the transformations algebraic numbers use.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "upolynomial.json"), "utf8"),
  );

  it.each(cases)("%s", (input, expected) => {
    expect(runUpolynomialCommand(input)).toBe(expected);
  });

  it("skips primes that divide a leading coefficient in the modular gcd", () => {
    const um = new UpolynomialManager();
    const shared = [-2n, 39103n * 39107n];
    const first = um.mul([3n, 5n, 7n * 39103n], shared);
    const second = um.mul(shared, [7n, 1n, 39103n]);
    expect(um.gcd(first, second)).toEqual(shared);
  });
});

// The harness command: ca n, then int flags, one c KIND poly line per constraint, v x num den per
// variable, and end. It prints each constraint's literal, then undef or the lemma.
const runCheckAssignment = (input: string) => {
  const solver = new NlsatSolver();
  const values: Rational[] = [];
  const output: string[] = [];
  for (const line of input.split("\n")) {
    const words = line.split(" ");
    if (words[0] === "v") values[Number(words[1])] = parseRational(`${words[2]}/${words[3]}`);
    if (words[0] !== "c") continue;
    const polynomial = parsePolynomial(solver.pm, words.slice(2).join(" "));
    const kind = words[1];
    const literal =
      kind === "LE"
        ? solver.mkIneqLiteral("GT", polynomial) ^ 1
        : kind === "GE"
          ? solver.mkIneqLiteral("LT", polynomial) ^ 1
          : solver.mkIneqLiteral(kind === "EQ" ? "EQ" : kind === "LT" ? "LT" : "GT", polynomial);
    solver.addUnitClause(literal);
    output.push(`lit ${literal}`);
  }
  const result = solver.check(values);
  const literals = result.clause.map((literal) => {
    const atom = solver.getAtom(literal);
    const sign = (literal & 1) === 1 ? "!" : "+";
    return ` ${literal} ${sign}${atom?.kind} ${atom === null ? "" : showPolynomial(atom.polynomial)}`;
  });
  output.push(result.status === "undef" ? "undef" : `lemma${literals.join("")}`);
  return output.join("\n");
};

describe("nlsat check_assignment", () => {
  // Random constraints of degree 2 or less, with the lemmas that Z3's nlsat solver returns for an
  // assignment that violates them, literal numbering and monomial order included.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "check-assignment.json"), "utf8"),
  );

  it.each(cases)("%s", (input, expected) => {
    expect(runCheckAssignment(input)).toBe(expected);
  });

  it("answers undef when every constraint holds, because of the clause [true]", () => {
    expect(runCheckAssignment("ca 1\nc GT 1:0^1\nv 0 1 1\nend")).toBe("lit 2\nundef");
  });

  it("explains with a polynomial of degree 2 in its maximal variable by factoring it", () => {
    expect(runCheckAssignment("ca 1\nint 0\nc LT 1:0^2 -4:\nv 0 3 1\nend")).toBe(
      "lit 2\nlemma 5 !GT [1:0^1 -2:] 3 !LT [1:0^2 -4:]",
    );
  });

  it("bounds an irrational root by linear polynomials, as Z3 does", () => {
    expect(runCheckAssignment("ca 1\nc EQ 1:0^2 -2:\nv 0 1 1\nend")).toBe(
      "lit 2\nlemma 5 !GT [1:0^1 1:] 7 !LT [4:0^1 -5:] 3 !EQ [1:0^2 -2:]",
    );
  });
});

describe("nra check_assignment", () => {
  // The monic m = x*y with x and y fixed by their bounds, and one more bound on m.
  const getCore = (
    factors: (x: number, y: number) => number[],
    kind: ConstraintKind,
    bound: bigint,
  ) => {
    const lra = new LarSolver(() => false);
    const x = lra.addVar(0, false);
    const y = lra.addVar(1, false);
    const m = lra.addVar(2, false);
    const core = new NlaCore(lra);
    core.addMonic(m, factors(x, y));
    const constraints = [
      lra.mkVarBound(x, KIND_GE, Rational.of(2n)),
      lra.mkVarBound(x, KIND_LE, Rational.of(2n)),
      lra.mkVarBound(y, KIND_GE, Rational.of(1n)),
      lra.mkVarBound(y, KIND_LE, Rational.of(1n)),
      lra.mkVarBound(m, kind, Rational.of(bound)),
    ];
    for (const constraint of constraints) lra.activate(constraint);
    lra.findFeasibleSolution();
    core.initToRefine();
    return { core, constraints };
  };

  it("refutes x*y <= 1 at x = 2 and y = 1 with a lemma", () => {
    const result = getCore((x, y) => [x, y], KIND_LE, 1n);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect([...result.core.lemmas[0].expl]).toContain(result.constraints[4]);
    expect(result.core.isCheckFeasible).toBe(true);
  });

  it("refutes x*x <= 1 at x = 2 with a lemma, factoring x^2 - 1", () => {
    const result = getCore((x) => [x, x], KIND_LE, 1n);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect([...result.core.lemmas[0].expl]).toContain(result.constraints[4]);
  });

  it("refutes x*x = 2 at x = 2 with a lemma, bounding the irrational root linearly", () => {
    const result = getCore((x) => [x, x], KIND_EQ, 2n);
    expect(new NraSolver(result.core).checkAssignment()).toBe(L_FALSE);
    expect(result.core.lemmas).toHaveLength(1);
    expect([...result.core.lemmas[0].expl]).toContain(result.constraints[4]);
  });
});
