import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";
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
