import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { NlsatUnsupportedError } from "../../src/errors";
import { L_FALSE, L_TRUE } from "../../src/prover/smt/solver/lbool";
import { AlgebraicManager, Anum } from "../../src/prover/smt/solver/nlsat/algebraic";
import { AtomTable, ScopedLiterals } from "../../src/prover/smt/solver/nlsat/atoms";
import { Evaluator } from "../../src/prover/smt/solver/nlsat/evaluator";
import { Explain } from "../../src/prover/smt/solver/nlsat/explain";
import type { IntervalSet } from "../../src/prover/smt/solver/nlsat/interval-set";
import { getSingleCell } from "../../src/prover/smt/solver/nlsat/levelwise";
import { Mpbq } from "../../src/prover/smt/solver/nlsat/mpbq";
import {
  type Atom,
  type IneqAtom,
  type IneqKind,
  isIneqAtom,
  type RootKind,
} from "../../src/prover/smt/solver/nlsat/types";
import { NlsatSolver } from "../../src/prover/smt/solver/nlsat/solver";
import { UpolynomialManager } from "../../src/prover/smt/solver/nlsat/upolynomial";
import {
  DEFAULT_FACTOR_PARAMS,
  factorUpolynomial,
} from "../../src/prover/smt/solver/nlsat/upolynomial-factorization";
import { Rational } from "../../src/prover/smt/solver/rational";
import {
  type Polynomial,
  PolynomialCache,
  PolynomialManager,
} from "../../src/prover/smt/solver/nlsat/polynomial";

const FIXTURES = join(import.meta.dirname, "../fixtures/nlsat");

const readCases = (name: string): [string, string][] =>
  JSON.parse(readFileSync(join(FIXTURES, `${name}.json`), "utf8"));

const runProgram = (program: string, runCommand: (words: string[], index: number) => string) =>
  program
    .split("\n")
    .map((line, index) => `${line.split(" ")[0]}${runCommand(line.split(" "), index)}`)
    .join("\n");

const parsePolynomial = (polynomialManager: PolynomialManager, text: string) => {
  const terms = text.trim() === "" ? [] : text.trim().split(/\s+/);
  const coefficients = terms.map((term) => BigInt(term.slice(0, term.indexOf(":"))));
  const monomials = terms.map((term) => {
    const powers = term
      .slice(term.indexOf(":") + 1)
      .split(",")
      .filter((power) => power !== "")
      .map((power) => power.split("^").map(Number));
    return polynomialManager.mkMonomial(
      powers.map((power) => power[0]),
      powers.map((power) => power[1]),
    );
  });
  return polynomialManager.mkPolynomial(coefficients, monomials);
};

const parsePolynomials = (polynomialManager: PolynomialManager, text: string) =>
  text.split(" ; ").map((part) => parsePolynomial(polynomialManager, part));

const showAnum = (algebraicManager: AlgebraicManager, anum: Anum) =>
  anum.value instanceof Rational
    ? ` q${anum.value}`
    : ` r[${anum.value.p.join(" ")}]#${algebraicManager.getRootIndex(anum)}(${anum.value.lower},${anum.value.upper})`;

const showPolynomial = (polynomial: Polynomial) =>
  `[${polynomial.ms
    .map(
      (monomial, index) =>
        `${polynomial.as[index]}:${monomial.vars.map((variable, power) => `${variable}^${monomial.degrees[power]}`).join(",")}`,
    )
    .join(" ")}]`;

const runPolynomialCommand = (input: string) => {
  const polynomialManager = new PolynomialManager();
  const cache = new PolynomialCache(polynomialManager);
  const command = input.slice(0, input.indexOf(" "));
  const rest = input.slice(command.length + 1);
  if (command === "factor") {
    const factors = cache.factor(parsePolynomial(polynomialManager, rest));
    return `factors${factors.map((factor) => ` ${showPolynomial(factor)}`).join("")}`;
  }
  if (command === "psc") {
    const variable = Number(rest.slice(0, rest.indexOf(" ")));
    const operands = rest.slice(rest.indexOf(" ") + 1).split(" ; ");
    const chain = cache.pscChain(
      parsePolynomial(polynomialManager, operands[0]),
      parsePolynomial(polynomialManager, operands[1]),
      variable,
    );
    return `psc${chain.map((element) => ` ${showPolynomial(element)}`).join("")}`;
  }
  const operands = rest.split(" ; ");
  return `gcd ${showPolynomial(polynomialManager.gcd(parsePolynomial(polynomialManager, operands[0]), parsePolynomial(polynomialManager, operands[1])))}`;
};

describe("nlsat polynomials", () => {
  it.each(readCases("polynomial"))("%s", (input, expected) => {
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

const runAlgebraicCommand = (input: string) => {
  const words = input.split(" ");
  const algebraicManager = new AlgebraicManager();
  if (words[0] === "select")
    return `select ${algebraicManager.select(new Anum(parseRational(words[1])), new Anum(parseRational(words[2]))).value}`;
  const variable = Number(words[1]);
  const count = Number(words[3]);
  const sample = words
    .slice(4, 4 + count)
    .map((word, index) => (index === variable ? undefined : new Anum(parseRational(word))));
  const polynomialManager = new PolynomialManager();
  const polynomial = parsePolynomial(polynomialManager, words.slice(4 + count).join(" "));
  const closest = algebraicManager.isolateRootsClosest(
    polynomialManager,
    polynomial,
    sample,
    parseRational(words[2]),
  );
  const show = (root: Anum) => (root.value instanceof Rational ? `${root.value}` : "irrational");
  return `closest${closest.roots.map((root, index) => ` ${closest.indices[index]}@${show(root)}`).join("")}`;
};

const runAnumProgram = (program: string) => {
  const algebraicManager = new AlgebraicManager();
  const polynomialManager = new PolynomialManager();
  const registers: Anum[] = [];
  const getRegister = (index: number) => {
    while (registers.length <= index) registers.push(new Anum(Rational.zero));
    return registers[index];
  };
  const runCommand = (words: string[]) => {
    const numbers = words.slice(1, 4).map(Number);
    switch (words[0]) {
      case "q":
        registers[numbers[0]] = new Anum(parseRational(words[2]));
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "root": {
        const roots = algebraicManager.isolateRoots(
          polynomialManager,
          polynomialManager.fromCoeffs(words.slice(3).map(BigInt), 0),
          [],
        );
        if (numbers[1] > roots.length) return " error";
        getRegister(numbers[0]);
        registers[numbers[0]] = roots[numbers[1] - 1];
        return showAnum(algebraicManager, registers[numbers[0]]);
      }
      case "add":
      case "mul":
      case "div":
      case "sel": {
        const first = getRegister(numbers[1]);
        const second = getRegister(numbers[2]);
        if (words[0] === "div" && algebraicManager.isZero(second)) return " error";
        const result =
          words[0] === "add"
            ? algebraicManager.add(first, second)
            : words[0] === "mul"
              ? algebraicManager.mul(first, second)
              : words[0] === "div"
                ? algebraicManager.div(first, second)
                : algebraicManager.select(first, second);
        getRegister(numbers[0]);
        registers[numbers[0]] = algebraicManager.copy(result);
        return showAnum(algebraicManager, registers[numbers[0]]);
      }
      case "pow":
      case "intlt":
      case "intgt": {
        const anum = getRegister(numbers[1]);
        const result =
          words[0] === "pow"
            ? algebraicManager.power(anum, numbers[2])
            : words[0] === "intlt"
              ? algebraicManager.intLt(anum)
              : algebraicManager.intGt(anum);
        getRegister(numbers[0]);
        registers[numbers[0]] = algebraicManager.copy(result);
        return showAnum(algebraicManager, registers[numbers[0]]);
      }
      case "neg":
        algebraicManager.neg(getRegister(numbers[0]));
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "inv":
        if (algebraicManager.isZero(getRegister(numbers[0]))) return " error";
        algebraicManager.inv(registers[numbers[0]]);
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "cmp": {
        const first = getRegister(numbers[0]);
        const second = getRegister(numbers[1]);
        return ` ${algebraicManager.compare(first, second)}${showAnum(algebraicManager, first)}${showAnum(algebraicManager, second)}`;
      }
      case "isint":
      case "israt": {
        const anum = getRegister(numbers[0]);
        return `${showFlag(words[0] === "isint" ? algebraicManager.isInt(anum) : algebraicManager.isRational(anum))}${showAnum(algebraicManager, anum)}`;
      }
      case "show":
        return showAnum(algebraicManager, getRegister(numbers[0]));
      default: {
        const rest = words[0] === "closest" ? words.slice(2) : words.slice(1);
        const separator = rest.indexOf(";");
        const polynomial = parsePolynomial(polynomialManager, rest.slice(0, separator).join(" "));
        const bindings = rest.slice(separator + 1).map((word) => word.split("=").map(Number));
        const values: Anum[] = [];
        for (const binding of bindings)
          values[binding[0]] = algebraicManager.copy(getRegister(binding[1]));
        let output = "";
        let roots: Anum[] = [];
        if (words[0] === "sign")
          output = ` ${algebraicManager.evalSignAt(polynomialManager, polynomial, values)}`;
        else if (words[0] === "iso") {
          roots = algebraicManager.isolateRoots(polynomialManager, polynomial, values);
          output = ` roots${roots.map((anum) => showAnum(algebraicManager, anum)).join("")}`;
        } else if (words[0] === "closest") {
          const closest = algebraicManager.isolateRootsClosest(
            polynomialManager,
            polynomial,
            values,
            parseRational(words[1]),
          );
          roots = closest.roots;
          output = ` roots${roots.map((anum) => showAnum(algebraicManager, anum)).join("")} idx${closest.indices.map((index) => ` ${index}`).join("")}`;
        } else {
          const signed = algebraicManager.isolateRootsWithSigns(
            polynomialManager,
            polynomial,
            values,
          );
          roots = signed.roots;
          output = ` roots${roots.map((anum) => showAnum(algebraicManager, anum)).join("")} signs${signed.signs.map((sign) => ` ${sign}`).join("")}`;
        }
        roots.forEach((root, index) => {
          getRegister(8 + index);
          registers[8 + index] = algebraicManager.copy(root);
        });
        output += " after";
        for (const binding of bindings) {
          registers[binding[1]] = algebraicManager.copy(values[binding[0]]);
          output += showAnum(algebraicManager, registers[binding[1]]);
        }
        return output;
      }
    }
  };
  return runProgram(program, runCommand);
};

describe("nlsat real algebraic numbers", () => {
  it.each(readCases("algebraic-numbers"))("%s", (program, expected) => {
    expect(runAnumProgram(program)).toBe(expected);
  });
});

const parseIneqKind = (text: string): IneqKind => {
  if (text === "EQ" || text === "LT" || text === "GT") return text;
  throw new Error(`${text} is not the kind of an inequality atom`);
};

const parseRootKind = (text: string): RootKind => {
  if (
    text === "ROOT_EQ" ||
    text === "ROOT_LT" ||
    text === "ROOT_GT" ||
    text === "ROOT_LE" ||
    text === "ROOT_GE"
  )
    return text;
  throw new Error(`${text} is not the kind of a root atom`);
};

const parseAtom = (polynomialManager: PolynomialManager, text: string): Atom => {
  const words = text.trim().split(" ");
  const boolVar = Number(words[0].slice(1));
  const maxVar = Number(words[2]);
  const factors = [...text.matchAll(/([eoi]\d*) ?\[([^\]]*)\]/g)];
  if (words[1].startsWith("ROOT"))
    return {
      kind: parseRootKind(words[1]),
      boolVar,
      maxVar,
      index: Number(factors[0][1].slice(1)),
      polynomial: parsePolynomial(polynomialManager, factors[0][2]),
    };
  return {
    kind: parseIneqKind(words[1]),
    boolVar,
    maxVar,
    polynomials: factors.map((factor) => parsePolynomial(polynomialManager, factor[2])),
    isEven: factors.map((factor) => factor[1] === "e"),
  };
};

const runEvaluatorProgram = (program: string, expected: string) => {
  const algebraicManager = new AlgebraicManager();
  const polynomialManager = new PolynomialManager();
  const assignment: (Anum | undefined)[] = [];
  const evaluator = new Evaluator(polynomialManager, algebraicManager, assignment);
  const registers: Anum[] = [];
  const sets: (IntervalSet | null)[] = [];
  const atoms: Atom[] = [];
  const clause = { id: 0, literals: [], isLearned: false, assumptions: null, isActive: false };
  const expectedLines = expected.split("\n");
  let variableCount = 0;
  const showSet = (set: IntervalSet | null | undefined) => {
    if (set === null || set === undefined) return " {}";
    const intervals = set.intervals.map(
      (interval) =>
        ` ${interval.isLowerOpen ? "(" : "["}${interval.lower === null ? " -oo" : showAnum(algebraicManager, interval.lower)} ,` +
        `${interval.upper === null ? " +oo" : showAnum(algebraicManager, interval.upper)} ${interval.isUpperOpen ? ")" : "]"}` +
        `j${interval.justification}${interval.clause === null ? "" : "c"}`,
    );
    return ` {${set.isFull ? "full" : "part"}${intervals.join("")} }`;
  };
  const showAssignment = () =>
    ` after${Array.from({ length: variableCount }, (_, variable) => {
      const value = assignment[variable];
      return value === undefined ? " _" : showAnum(algebraicManager, value);
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
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "root": {
        const coeffs = words.slice(3).map(BigInt);
        while (coeffs[coeffs.length - 1] === 0n) coeffs.pop();
        registers[numbers[0]] = algebraicManager.isolateRoots(
          polynomialManager,
          polynomialManager.fromCoeffs(coeffs, 0),
          [],
        )[numbers[1] - 1];
        return showAnum(algebraicManager, registers[numbers[0]]);
      }
      case "set":
        assignment[numbers[0]] = algebraicManager.copy(
          registers[numbers[1]] ?? new Anum(Rational.zero),
        );
        return "";
      case "ineq":
      case "rootatom": {
        const printed = expectedLines[index].slice(words[0].length);
        atoms.push(parseAtom(polynomialManager, printed));
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
        registers[7] = evaluator.ism.pickInComplement(set, numbers[2] === 1);
        return `${showAnum(algebraicManager, registers[7])}${showSet(set)}`;
      }
      case "pickmax": {
        const max = evaluator.ism.pickMaxInComplement(sets[numbers[0]] ?? null);
        return `${max === null ? " 0" : ` 1${showAnum(algebraicManager, max)}`}${showSet(sets[numbers[0]])}`;
      }
      default: {
        const max = evaluator.ism.queryMaxInComplement(sets[numbers[0]] ?? null);
        return `${max === null ? " 0" : ` 1${showAnum(algebraicManager, max.sup)}${showFlag(max.isAttained)}`}${showSet(sets[numbers[0]])}`;
      }
    }
  };
  return runProgram(program, runCommand);
};

const runLevelwiseProgram = (program: string) => {
  const algebraicManager = new AlgebraicManager();
  const polynomialManager = new PolynomialManager();
  const cache = new PolynomialCache(polynomialManager);
  const sample: Anum[] = [];
  const registers: Anum[] = [];
  let variableCount = 0;
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
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "root":
        registers[numbers[0]] = algebraicManager.isolateRoots(
          polynomialManager,
          polynomialManager.fromCoeffs(words.slice(3).map(BigInt), 0),
          [],
        )[numbers[1] - 1];
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "set":
        sample[numbers[0]] = algebraicManager.copy(registers[numbers[1]]);
        return "";
      default: {
        const polynomials = parsePolynomials(polynomialManager, words.slice(3).join(" "));
        const cell = getSingleCell(
          polynomialManager,
          algebraicManager,
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
          sample[variable] === undefined ? " _" : showAnum(algebraicManager, sample[variable]),
        );
        return `${intervals.join("")} after${values.join("")}`;
      }
    }
  };
  return runProgram(program, runCommand);
};

const runExplainProgram = (program: string) => {
  const algebraicManager = new AlgebraicManager();
  const polynomialManager = new PolynomialManager();
  const cache = new PolynomialCache(polynomialManager);
  const table = new AtomTable(polynomialManager, cache);
  const sample: Anum[] = [];
  const var2eq: IneqAtom[] = [];
  const evaluator = new Evaluator(polynomialManager, algebraicManager, sample);
  const explain = new Explain(polynomialManager, algebraicManager, cache, {
    atoms: table,
    sample,
    getValue: (literal) => {
      const atom = table.getAtom(literal);
      if (atom === null || sample[atom.maxVar] === undefined) return 0;
      return evaluator.eval(atom, (literal & 1) === 1) ? 1 : -1;
    },
    var2eq,
  });
  const registers: Anum[] = [];
  const atoms: number[] = [];
  const showAtom = (boolVar: number) => {
    const atom = table.atoms[boolVar];
    if (atom === null) throw new Error(`b${boolVar} has no atom`);
    const body = isIneqAtom(atom)
      ? atom.polynomials
          .map(
            (polynomial, index) =>
              ` ${atom.isEven[index] ? "e" : "o"}${showPolynomial(polynomial)}`,
          )
          .join("")
      : ` i${atom.index} ${showPolynomial(atom.polynomial)}`;
    return ` b${boolVar} ${atom.kind} ${atom.maxVar}${body}`;
  };
  const runCommand = (words: string[]) => {
    const numbers = words.slice(1).map(Number);
    switch (words[0]) {
      case "q":
        registers[numbers[0]] = new Anum(parseRational(words[2]));
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "root":
        registers[numbers[0]] = algebraicManager.isolateRoots(
          polynomialManager,
          polynomialManager.fromCoeffs(words.slice(3).map(BigInt), 0),
          [],
        )[numbers[1] - 1];
        return showAnum(algebraicManager, registers[numbers[0]]);
      case "set":
        sample[numbers[0]] = algebraicManager.copy(registers[numbers[1]]);
        return "";
      case "ineq": {
        const count = numbers[1];
        const polynomials = parsePolynomials(polynomialManager, words.slice(3 + count).join(" "));
        const isEven = numbers.slice(2, 2 + count).map((flag) => flag === 1);
        atoms.push(table.mkIneqAtom(parseIneqKind(words[1]), polynomials, isEven));
        table.incRef(2 * atoms[atoms.length - 1]);
        return showAtom(atoms[atoms.length - 1]);
      }
      case "rootatom": {
        const polynomial = parsePolynomial(polynomialManager, words.slice(4).join(" "));
        atoms.push(table.mkRootAtom(parseRootKind(words[1]), numbers[1], numbers[2], polynomial));
        table.incRef(2 * atoms[atoms.length - 1]);
        return showAtom(atoms[atoms.length - 1]);
      }
      case "eq": {
        const atom = table.atoms[atoms[numbers[1]]];
        if (atom === null || !isIneqAtom(atom))
          throw new Error(`atom ${numbers[1]} is not an inequality`);
        var2eq[numbers[0]] = atom;
        return "";
      }
      case "explain": {
        const literals = Array.from(
          { length: (numbers.length - 1) / 2 },
          (_, index) => 2 * atoms[numbers[1 + 2 * index]] + numbers[2 + 2 * index],
        );
        const result = new ScopedLiterals(table);
        if (numbers[0] === 1) explain.computeLinearExplanation(literals, result);
        else explain.computeConflictExplanation(literals, result);
        const output = result.literals.map((literal) => ` ${literal}${showAtom(literal >> 1)}`);
        result.reset();
        return output.join("");
      }
      default:
        return "";
    }
  };
  return runProgram(program, runCommand);
};

describe("nlsat levelwise", () => {
  it.each(readCases("levelwise"))("%s", (program, expected) => {
    expect(runLevelwiseProgram(program)).toBe(expected);
  });
});

describe("nlsat explain", () => {
  it.each(readCases("explain"))("%s", (program, expected) => {
    expect(runExplainProgram(program)).toBe(expected);
  });

  it("throws a named error for a linear cell around an irrational section, where Z3 exits", () => {
    const program = [
      "vars 2",
      "root 0 2 -2 0 1",
      "set 0 0",
      "q 1 10/2",
      "set 1 1",
      "ineq EQ 1 0 -2: 1:0^2",
      "explain 1 0 0",
    ].join("\n");
    expect(() => runExplainProgram(program)).toThrow(NlsatUnsupportedError);
  });
});

describe("nlsat evaluator", () => {
  it.each(readCases("evaluator"))("%s", (program, expected) => {
    expect(runEvaluatorProgram(program, expected)).toBe(expected);
  });
});

describe("nlsat polynomial factorization", () => {
  it.each(readCases("polynomial-factorization"))("%s", (input, expected) => {
    expect(runPolynomialCommand(input)).toBe(expected);
  });
});

describe("nlsat algebraic numbers", () => {
  it.each(readCases("algebraic"))("%s", (input, expected) => {
    expect(runAlgebraicCommand(input)).toBe(expected);
  });

  it("isolates the irrational roots closest to the sample", () => {
    expect(runAlgebraicCommand("closest 1 3 2 2 0 1:1^2 -2:")).toBe("closest 2@irrational");
  });
});

const showCoeffs = (coeffs: readonly bigint[]) => ` [${coeffs.join(" ")}]`;

const showFlag = (isTrue: boolean) => ` ${isTrue ? 1 : 0}`;

const showIsolation = (upolynomialManager: UpolynomialManager, coeffs: readonly bigint[]) => {
  const squareFree = upolynomialManager.squareFree(coeffs);
  const isolated = upolynomialManager.sqfIsolateRoots(squareFree);
  const refined = isolated.lowers.map((lower, index) => {
    const refinable = upolynomialManager.isolating2refinable(
      squareFree,
      lower,
      isolated.uppers[index],
    );
    if (!refinable.isInterval) return ` root ${refinable.lower}`;
    const result = upolynomialManager.refineToPrecision(
      squareFree,
      refinable.lower,
      refinable.upper,
      20,
    );
    const rootId = upolynomialManager.getRootId(squareFree, result.lower);
    if (!result.isInterval)
      return ` int ${refinable.lower} ${refinable.upper} proot ${result.lower} id${rootId}`;
    const signLower = upolynomialManager.evalSignAtBq(squareFree, result.lower);
    const normalized = upolynomialManager.normalizeInterval(
      squareFree,
      result.lower,
      result.upper,
      signLower,
    );
    const shownNormalized =
      normalized === null
        ? ` n0 ${result.lower} ${result.upper}`
        : ` n1 ${normalized.lower} ${normalized.upper}`;
    return ` int ${refinable.lower} ${refinable.upper} p ${result.lower} ${result.upper} id${rootId}${shownNormalized}`;
  });
  return `${showCoeffs(squareFree)} roots${isolated.roots.map((root) => ` ${root}`).join("")} intervals${isolated.lowers.map((lower, index) => ` ${lower} ${isolated.uppers[index]}`).join("")} refined${refined.join("")}`;
};

const runUpolynomialCommand = (input: string) => {
  const words = input.split(" ");
  const operation = words[0];
  const isModular = operation.startsWith("z");
  const operands = words
    .slice(isModular ? 2 : 1)
    .join(" ")
    .split(" ; ")
    .map((operand) => (operand === "" ? [] : operand.split(" ")));
  const upolynomialManager = new UpolynomialManager();
  const parseCoeffs = (operand: string[]) => upolynomialManager.set(operand.map(BigInt));
  const first = parseCoeffs(operands[0]);
  if (isModular)
    return `${operation}${upolynomialManager.withZp(BigInt(words[1]), () => {
      const left = upolynomialManager.set(first);
      const right = upolynomialManager.set(parseCoeffs(operands[1]));
      if (operation === "zgcd") return showCoeffs(upolynomialManager.gcd(left, right));
      if (operation === "zextgcd") {
        const result = upolynomialManager.extGcd(left, right);
        return showCoeffs(result.u) + showCoeffs(result.v) + showCoeffs(result.d);
      }
      if (operation === "zdivrem") {
        const division = upolynomialManager.divRem(left, right);
        return showCoeffs(division.quotient) + showCoeffs(division.remainder);
      }
      if (operation === "zsqf") return showCoeffs(upolynomialManager.squareFree(left));
      if (operation === "zsqfp") return showFlag(upolynomialManager.isSquareFree(left));
      if (operation === "zmonic") return showCoeffs(upolynomialManager.mkMonic(left));
      if (operation === "zdivides") return showFlag(upolynomialManager.divides(left, right));
      if (operation === "zmul") return showCoeffs(upolynomialManager.mul(left, right));
      const exact = upolynomialManager.exactDiv(left, right);
      return exact === null ? " 0" : ` 1${showCoeffs(exact)}`;
    })}`;
  const second = operands[1] ?? [];
  if (operation === "isolate") return `isolate${showIsolation(upolynomialManager, first)}`;
  if (operation === "gcd")
    return `gcd${showCoeffs(upolynomialManager.gcd(first, parseCoeffs(second)))}`;
  if (operation === "divrem") {
    const division = upolynomialManager.divRem(first, parseCoeffs(second));
    return `divrem ${division.power}${showCoeffs(division.quotient)}${showCoeffs(division.remainder)}`;
  }
  if (operation === "srem")
    return `srem${showCoeffs(upolynomialManager.srem(first, parseCoeffs(second)))}`;
  if (operation === "exact") {
    const exact = upolynomialManager.exactDiv(first, parseCoeffs(second));
    return exact === null ? "exact 0" : `exact 1${showCoeffs(exact)}`;
  }
  if (operation === "divides")
    return `divides${showFlag(upolynomialManager.divides(first, parseCoeffs(second)))}`;
  if (operation === "sqf") return `sqf${showCoeffs(upolynomialManager.squareFree(first))}`;
  if (operation === "sqfp") return `sqfp${showFlag(upolynomialManager.isSquareFree(first))}`;
  if (operation === "sturm")
    return `sturm${upolynomialManager.sturmSeq(first).map(showCoeffs).join("")}`;
  if (operation === "tarski")
    return `tarski${upolynomialManager.sturmTarskiSeq(first, parseCoeffs(second)).map(showCoeffs).join("")}`;
  if (operation === "q2bq") {
    const result = upolynomialManager.convertQ2bqInterval(
      first,
      parseRational(second[0]),
      parseRational(second[1]),
    );
    return result.isInterval ? `q2bq 1 ${result.lower} ${result.upper}` : `q2bq 0 ${result.lower}`;
  }
  if (operation === "knuth")
    return `knuth ${upolynomialManager.knuthPositiveRootUpperBound(first)} ${upolynomialManager.knuthNegativeRootUpperBound(first)} ${upolynomialManager.nonzeroRootLowerBound(first)}`;
  if (operation === "flips")
    return `flips${showCoeffs(upolynomialManager.pMinusX(first))}${showCoeffs(upolynomialManager.p1DivX(first))}${showCoeffs(upolynomialManager.removeZeroRoots(first))}`;
  if (operation === "transq")
    return `transq${showCoeffs(upolynomialManager.translateQ(first, parseRational(second[0])))}`;
  if (operation === "compq")
    return `compq${showCoeffs(upolynomialManager.composePQX(first, parseRational(second[0])))}`;
  if (operation === "signq")
    return `signq ${upolynomialManager.evalSignAtQ(first, parseRational(second[0]))}`;
  if (operation === "signbq")
    return `signbq ${upolynomialManager.evalSignAtBq(first, Mpbq.of(BigInt(second[0]), Number(second[1])))}`;
  return `pw${showCoeffs(upolynomialManager.pw(first, Number(second[0])))}`;
};

const runFactorCommand = (input: string) => {
  const words = input.split(" ");
  const upolynomialManager = new UpolynomialManager();
  const params =
    words[0] === "afactor"
      ? { maxPrime: 31, primeTrials: 1, maxSearchSize: 5000 }
      : DEFAULT_FACTOR_PARAMS;
  const result = factorUpolynomial(
    upolynomialManager,
    upolynomialManager.set(words.slice(1).map(BigInt)),
    params,
  );
  const factors = result.factors.factors.map(
    (factor, index) => `${showCoeffs(factor)}^${result.factors.degrees[index]}`,
  );
  return `${words[0]} ${result.isComplete ? 1 : 0} ${result.factors.constant}${factors.join("")}`;
};

describe("nlsat univariate factorization", () => {
  it.each(readCases("upolynomial-factorization"))("%s", (input, expected) => {
    expect(runFactorCommand(input)).toBe(expected);
  });

  it("factors a quadratic whose discriminant is past the precision of a double", () => {
    const root = 1234567890123456789012345678901n;
    expect(runFactorCommand(`factor ${5n * root} ${-(root + 5n)} 1`)).toBe(
      `factor 1 1 [${-root} 1]^1 [-5 1]^1`,
    );
    expect(runFactorCommand(`factor ${5n * root + 1n} ${-(root + 5n)} 1`)).toBe(
      `factor 1 1 [${5n * root + 1n} ${-(root + 5n)} 1]^1`,
    );
  });
});

describe("nlsat univariate polynomials", () => {
  it.each(readCases("upolynomial"))("%s", (input, expected) => {
    expect(runUpolynomialCommand(input)).toBe(expected);
  });

  it("skips primes that divide a leading coefficient in the modular gcd", () => {
    const upolynomialManager = new UpolynomialManager();
    const shared = [-2n, 39103n * 39107n];
    const first = upolynomialManager.mul([3n, 5n, 7n * 39103n], shared);
    const second = upolynomialManager.mul(shared, [7n, 1n, 39103n]);
    expect(upolynomialManager.gcd(first, second)).toEqual(shared);
  });
});

const createConstraintLiteral = (solver: NlsatSolver, kind: string, text: string) => {
  const polynomial = parsePolynomial(solver.pm, text);
  return kind === "LE"
    ? solver.mkIneqLiteral("GT", [polynomial], [false]) ^ 1
    : kind === "GE"
      ? solver.mkIneqLiteral("LT", [polynomial], [false]) ^ 1
      : solver.mkIneqLiteral(
          kind === "EQ" ? "EQ" : kind === "LT" ? "LT" : "GT",
          [polynomial],
          [false],
        );
};

const runCheckAssignment = (input: string) => {
  const solver = new NlsatSolver();
  const values: Anum[] = [];
  const output: string[] = [];
  let count = 0;
  for (const line of input.split("\n")) {
    const words = line.split(" ");
    if (words[0] === "ca") count = Number(words[1]);
    if (words[0] === "int")
      for (let variable = 0; variable < count; variable++)
        solver.mkVar(words[variable + 1] === "1");
    if (words[0] === "v")
      values[Number(words[1])] = new Anum(parseRational(`${words[2]}/${words[3]}`));
    if (words[0] !== "c") continue;
    const literal = createConstraintLiteral(solver, words[1], words.slice(2).join(" "));
    solver.mkExternalClause([literal], null);
    output.push(`lit ${literal}`);
  }
  const result = solver.checkAssignment(values);
  const literals = result.clause.map((literal) => {
    const atom = solver.getAtom(literal);
    const sign = (literal & 1) === 1 ? "!" : "+";
    const polynomial = atom !== null && isIneqAtom(atom) ? atom.polynomials[0] : null;
    return ` ${literal} ${sign}${atom?.kind} ${polynomial === null ? "" : showPolynomial(polynomial)}`;
  });
  output.push(result.result === L_FALSE ? `lemma${literals.join("")}` : "undef");
  return output.join("\n");
};

describe("nlsat check_assignment", () => {
  it.each(readCases("check-assignment"))("%s", (input, expected) => {
    expect(runCheckAssignment(input)).toBe(expected);
  });

  it("answers undef when every constraint holds, because of the clause [true]", () => {
    expect(runCheckAssignment("ca 1\nint 0\nc GT 1:0^1\nv 0 1 1\nend")).toBe("lit 2\nundef");
  });

  it("explains with a polynomial of degree 2 in its maximal variable by factoring it", () => {
    expect(runCheckAssignment("ca 1\nint 0\nc LT 1:0^2 -4:\nv 0 3 1\nend")).toBe(
      "lit 2\nlemma 5 !GT [1:0^1 -2:] 3 !LT [1:0^2 -4:]",
    );
  });

  it("bounds an irrational root by linear polynomials, as Z3 does", () => {
    expect(runCheckAssignment("ca 1\nint 0\nc EQ 1:0^2 -2:\nv 0 1 1\nend")).toBe(
      "lit 2\nlemma 5 !GT [1:0^1 1:] 7 !LT [4:0^1 -5:] 3 !EQ [1:0^2 -2:]",
    );
  });
});

const runSearch = (input: string) => {
  const solver = new NlsatSolver();
  const atoms: number[] = [];
  const output: string[] = [];
  const header = input.split("\n")[0].split(" ");
  if (header[2] !== "0") solver.maxConflicts = Number(header[2]);
  for (const line of input.split("\n")) {
    const words = line.split(" ");
    if (words[0] === "int") for (const flag of words.slice(1)) solver.mkVar(flag === "1");
    if (words[0] === "a")
      atoms.push(createConstraintLiteral(solver, words[1], words.slice(2).join(" ")));
    if (words[0] !== "cl") continue;
    const literals = words
      .slice(2)
      .map(Number)
      .map((reference) => (reference > 0 ? atoms[reference - 1] : atoms[-reference - 1] ^ 1));
    output.push(`clause ${literals.join(" ")}`);
    solver.mkExternalClause(literals, words[1] === "-1" ? null : Number(words[1]));
  }
  const result = solver.check();
  output.push(result === L_TRUE ? "sat" : result === L_FALSE ? "unsat" : "undef");
  const stats = solver.stats;
  const counts = [
    ["conflicts", stats.conflicts],
    ["propagations", stats.propagations],
    ["decisions", stats.decisions],
    ["restarts", stats.restarts],
    ["stages", stats.stages],
    ["irrational_assignments", stats.irrationalAssignments],
  ] as const;
  output.push(
    `stats${counts.map((count) => (count[1] > 0 ? ` ${count[0]}=${count[1]}` : "")).join("")}`,
  );
  if (result === L_TRUE)
    output.push(
      `model${Array.from({ length: Number(header[1]) }, (_value, variable) => showAnum(solver.am, solver.getValue(variable))).join("")}`,
    );
  if (result === L_FALSE)
    output.push(
      `core${solver
        .getCore()
        .map((assumption) => ` ${assumption}`)
        .join("")}`,
    );
  return output.join("\n");
};

describe("nlsat search", () => {
  it.each(readCases("search"))("%s", (input, expected) => {
    expect(runSearch(input)).toBe(expected);
  });
});
