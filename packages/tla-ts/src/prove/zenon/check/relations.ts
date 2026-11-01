// Whether the hypotheses make a relation reflexive, symmetric or transitive, which Zenon's rules for
// relations other than = rely on. The property holds when no way for the relation to hold among
// three elements satisfies the ground instances of the hypotheses and breaks the property.

import type { CheckContext, RelationProperty, Term } from "./terms";

type Polarity = "positive" | "negative" | "both";

// A hypothesis as a test on how a relation holds among three elements: `values` gives the bound
// variables their elements and bit 3 * i + j of `holds` says whether the relation holds from
// element i to element j.
type GroundTest = (values: number[], holds: number) => boolean;

const ELEMENTS = [0, 1, 2];

// The type Zenon gives a variable that its binder leaves untyped, which ranges over everything.
const UNTYPED = "zenon_U";

// The ground instances of a hypothesis over three elements. A universal quantifier where the
// hypothesis asserts it, or an existential where it denies it, becomes a test over the three
// elements, which the hypothesis implies. Undefined when the hypothesis says anything but how the
// relation holds between bound variables, so that it's left out.
const getGroundTest = (
  formula: Term,
  symbol: string,
  bound: string[],
  polarity: Polarity,
): GroundTest | undefined => {
  const flip = (): Polarity =>
    polarity === "both" ? "both" : polarity === "positive" ? "negative" : "positive";
  switch (formula.kind) {
    case "true":
      return () => true;
    case "false":
      return () => false;
    case "not": {
      const operand = getGroundTest(formula.args[0], symbol, bound, flip());
      return operand && ((values, holds) => !operand(values, holds));
    }
    case "and":
    case "or":
    case "imply":
    case "equiv": {
      const left = getGroundTest(
        formula.args[0],
        symbol,
        bound,
        formula.kind === "imply" ? flip() : formula.kind === "equiv" ? "both" : polarity,
      );
      const right = getGroundTest(
        formula.args[1],
        symbol,
        bound,
        formula.kind === "equiv" ? "both" : polarity,
      );
      if (left === undefined || right === undefined) return undefined;
      if (formula.kind === "and")
        return (values, holds) => left(values, holds) && right(values, holds);
      if (formula.kind === "or")
        return (values, holds) => left(values, holds) || right(values, holds);
      if (formula.kind === "imply")
        return (values, holds) => !left(values, holds) || right(values, holds);
      return (values, holds) => left(values, holds) === right(values, holds);
    }
    case "all":
    case "ex": {
      const isUniversal =
        formula.kind === "all" ? polarity === "positive" : polarity === "negative";
      if (!isUniversal || formula.symbol !== UNTYPED) return undefined;
      const body = getGroundTest(
        formula.args[1],
        symbol,
        [...bound, formula.args[0].symbol],
        polarity,
      );
      if (body === undefined) return undefined;
      return formula.kind === "all"
        ? (values, holds) => ELEMENTS.every((element) => body([...values, element], holds))
        : (values, holds) => ELEMENTS.some((element) => body([...values, element], holds));
    }
    case "app": {
      if (formula.symbol !== symbol || formula.args.length !== 2) return undefined;
      const positions = formula.args.map((inner) =>
        inner.kind === "var" ? bound.lastIndexOf(inner.symbol) : -1,
      );
      if (positions.includes(-1)) return undefined;
      return (values, holds) =>
        ((holds >> (3 * values[positions[0]] + values[positions[1]])) & 1) === 1;
    }
    default:
      return undefined;
  }
};

// = has every property. Another relation has the ones the hypotheses give it.
export const createRelationProperties = (context: CheckContext) => {
  const cache = new Map<string, boolean>();
  const hasProperty = (symbol: string, property: RelationProperty) => {
    const key = `${property}:${symbol}`;
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const tests = context.hypotheses.flatMap((hypothesis) => {
      const test = getGroundTest(hypothesis, symbol, [], "positive");
      return test === undefined ? [] : [test];
    });
    const has = (holds: number, from: number, to: number) => ((holds >> (3 * from + to)) & 1) === 1;
    const isBroken = (holds: number) =>
      property === "reflexive"
        ? !has(holds, 0, 0)
        : property === "symmetric"
          ? has(holds, 0, 1) && !has(holds, 1, 0)
          : has(holds, 0, 1) && has(holds, 1, 2) && !has(holds, 0, 2);
    const result = [...Array(512).keys()].every(
      (holds) => !isBroken(holds) || !tests.every((test) => test([], holds)),
    );
    cache.set(key, result);
    return result;
  };
  return (symbol: string, properties: RelationProperty[]) =>
    symbol === "=" || properties.every((property) => hasProperty(symbol, property));
};
