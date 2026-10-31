import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { isolateRootsClosest, selectBetween } from "../../src/prove/smt/solver/nlsat/algebraic";
import { NlsatSolver } from "../../src/prove/smt/solver/nlsat/solver";
import { Rational } from "../../src/prove/smt/solver/rational";
import {
  NlsatOutOfScope,
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

  it("refuses to factor a polynomial of degree 2 in every variable", () => {
    expect(() => runPolynomialCommand("factor 1:0^2 -2:")).toThrow(NlsatOutOfScope);
  });

  it("refuses the subresultants of a polynomial of degree 2", () => {
    expect(() => runPolynomialCommand("psc 0 1:0^2 -2: ; 1:0^1 -1:")).toThrow(NlsatOutOfScope);
  });
});

const parseRational = (text: string) => {
  const parts = text.split("/");
  return Rational.of(BigInt(parts[0]), BigInt(parts[1] ?? "1"));
};

// The harness commands: select a b, and closest x s n v0 ... v(n-1) poly, which leaves x unassigned.
const runAlgebraicCommand = (input: string) => {
  const words = input.split(" ");
  if (words[0] === "select")
    return `select ${selectBetween(parseRational(words[1]), parseRational(words[2]))}`;
  const variable = Number(words[1]);
  const count = Number(words[3]);
  const sample = words
    .slice(4, 4 + count)
    .map((word, index) => (index === variable ? undefined : parseRational(word)));
  const pm = new PolynomialManager();
  const polynomial = parsePolynomial(pm, words.slice(4 + count).join(" "));
  const closest = isolateRootsClosest(pm, polynomial, sample, variable);
  return `closest${closest.roots.map((root, index) => ` ${closest.indices[index]}@${root}`).join("")}`;
};

describe("nlsat algebraic numbers", () => {
  // Random rational intervals and polynomials of degree 1 in the root variable, with the numbers
  // that Z3's algebraic number manager selects and isolates for them.
  const cases: [string, string][] = JSON.parse(
    readFileSync(join(FIXTURES, "algebraic.json"), "utf8"),
  );

  it.each(cases)("%s", (input, expected) => {
    expect(runAlgebraicCommand(input)).toBe(expected);
  });

  it("refuses a root variable of degree 2, whose roots may be irrational", () => {
    expect(() => runAlgebraicCommand("closest 1 3 2 2 0 1:1^2 -2:")).toThrow(NlsatOutOfScope);
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

  it("refuses to explain with a polynomial of degree 2 in its maximal variable", () => {
    expect(() => runCheckAssignment("ca 1\nc LT 1:0^2 -4:\nv 0 3 1\nend")).toThrow(NlsatOutOfScope);
  });

  it("refuses to explain with an irrational root", () => {
    expect(() => runCheckAssignment("ca 1\nc EQ 1:0^2 -2:\nv 0 1 1\nend")).toThrow(NlsatOutOfScope);
  });
});
