// test262's harness/regExpUtils.js, typed so that tla-ts can compile it. Its apply calls are
// spreads, which pass the same code points.

interface CodePointRanges {
  loneCodePoints: number[];
  ranges: number[][];
}

interface StringsClass {
  regExp: RegExp;
  expression: string;
  matchStrings: string[];
  nonMatchStrings?: string[];
}

// oxlint-disable-next-line no-unused-vars
function buildString(args: CodePointRanges) {
  const loneCodePoints = args.loneCodePoints;
  const ranges = args.ranges;
  const CHUNK_SIZE = 10000;
  let result = String.fromCodePoint(...loneCodePoints);
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const start = range[0];
    const end = range[1];
    let codePoints: number[] = [];
    for (let codePoint = start; codePoint <= end; codePoint++) {
      codePoints.push(codePoint);
      if (codePoints.length === CHUNK_SIZE) {
        result += String.fromCodePoint(...codePoints);
        codePoints = [];
      }
    }
    result += String.fromCodePoint(...codePoints);
  }
  return result;
}

function printCodePoint(codePoint: number | undefined) {
  const hex = Number(codePoint).toString(16).toUpperCase().padStart(6, "0");
  return `U+${hex}`;
}

function printStringCodePoints(string: string) {
  const buf: string[] = [];
  for (const symbol of string) {
    buf.push(printCodePoint(symbol.codePointAt(0)));
  }
  return buf.join(" ");
}

// oxlint-disable-next-line no-unused-vars
function testPropertyEscapes(regExp: RegExp, string: string, expression: string) {
  if (!regExp.test(string)) {
    for (const symbol of string) {
      const formatted = printCodePoint(symbol.codePointAt(0));
      assert(regExp.test(symbol), `\`${expression}\` should match ${formatted} (\`${symbol}\`)`);
    }
  }
}

function testPropertyOfStrings(args: StringsClass) {
  const regExp = args.regExp;
  const expression = args.expression;
  const matchStrings = args.matchStrings;
  const nonMatchStrings = args.nonMatchStrings;
  const allStrings = matchStrings.join("");
  if (!regExp.test(allStrings)) {
    for (const string of matchStrings) {
      assert(
        regExp.test(string),
        `\`${expression}\` should match ${string} (${printStringCodePoints(string)})`,
      );
    }
  }

  if (!nonMatchStrings) return;

  const allNonMatchStrings = nonMatchStrings.join("");
  if (regExp.test(allNonMatchStrings)) {
    for (const string of nonMatchStrings) {
      assert(
        !regExp.test(string),
        `\`${expression}\` should not match ${string} (${printStringCodePoints(string)})`,
      );
    }
  }
}

// oxlint-disable-next-line no-unused-vars
const testExtendedCharacterClass = testPropertyOfStrings;

// oxlint-disable-next-line no-unused-vars
function matchValidator(expectedEntries: unknown[], expectedIndex: number, expectedInput: string) {
  return function (match: RegExpMatchArray) {
    assert.compareArray(match, expectedEntries, "Match entries");
    assert.sameValue(match.index, expectedIndex, "Match index");
    assert.sameValue(match.input, expectedInput, "Match input");
  };
}
