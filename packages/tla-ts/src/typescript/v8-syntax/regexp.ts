// Ported from V8 src/regexp/regexp-parser.cc and regexp-error.h; see LICENSE-v8.
// V8's regular expression parser (src/regexp/regexp-parser.cc in V8 14.6), reduced to the checks
// that decide whether a pattern is a syntax error and which RegExpError it reports first.
import { TlaTypeScriptError } from "../../errors";
import {
  BINARY_PROPERTIES,
  GENERAL_CATEGORY_VALUES,
  SCRIPT_VALUES,
  STRING_PROPERTIES,
} from "./regexp-properties";

const END = 1 << 21;
const INFINITY = 0x7fffffff;
const MAX_CAPTURES = 32767;
// V8 recurses once per nested class under the v flag and reports a stack overflow at a depth that
// depends on the stack it was called with.
const MAX_CLASS_DEPTH = 1000;
const ID_START = /[$_\p{ID_Start}]/u;
const ID_CONTINUE = /[$_\u200c\u200d\p{ID_Continue}]/u;
const PROPERTY_CHARACTER = /\w/;
const CONTROL_ESCAPES = new Map([
  ["f", 0x0c],
  ["n", 0x0a],
  ["r", 0x0d],
  ["t", 0x09],
  ["v", 0x0b],
]);

type GroupKind = "pattern" | "capture" | "grouping" | "lookahead" | "lookbehind";

type TermKind = "none" | "atom" | "lookahead" | "lookbehind";

type ClassEscape = "none" | "ranges" | "strings";

type ClassOperandKind = "character" | "range" | "disjunction" | "escape" | "nested";

interface Interval {
  from: number;
  to: number;
}

interface Group {
  previous: Group | undefined;
  kind: GroupKind;
  captureIndex: number;
  captureName: string | undefined;
  intervals: Interval[];
}

interface ClassAtom {
  character: number;
  isClass: boolean;
}

interface ClassOperand {
  kind: ClassOperandKind;
  character: number;
  hasStrings: boolean;
}

interface Quantifier {
  min: number;
  max: number;
}

interface PropertyName {
  name: string;
  value: string | undefined;
}

const is = (codePoint: number, character: string) => codePoint === character.charCodeAt(0);

const isOneOf = (codePoint: number, characters: string) =>
  codePoint < 0x80 && characters.includes(String.fromCharCode(codePoint));

const getCharacter = (codePoint: number) =>
  codePoint === END ? "" : String.fromCodePoint(codePoint);

const isDecimalDigit = (codePoint: number) => codePoint >= 0x30 && codePoint <= 0x39;

const isOctalDigit = (codePoint: number) => codePoint >= 0x30 && codePoint <= 0x37;

const getHexValue = (codePoint: number) =>
  isDecimalDigit(codePoint)
    ? codePoint - 0x30
    : (codePoint | 0x20) >= 0x61 && (codePoint | 0x20) <= 0x66
      ? (codePoint | 0x20) - 0x57
      : -1;

const isLeadSurrogate = (codePoint: number) => codePoint >= 0xd800 && codePoint <= 0xdbff;

const isTrailSurrogate = (codePoint: number) => codePoint >= 0xdc00 && codePoint <= 0xdfff;

const isIdentifierStart = (codePoint: number) =>
  codePoint <= 0x10ffff && ID_START.test(String.fromCodePoint(codePoint));

const isIdentifierPart = (codePoint: number) =>
  codePoint <= 0x10ffff && ID_CONTINUE.test(String.fromCodePoint(codePoint));

const contains = (interval: Interval, index: number) =>
  interval.from <= index && index <= interval.to;

const isInsideCaptureGroup = (group: Group, name: string) => {
  for (
    let ancestor: Group | undefined = group;
    ancestor !== undefined;
    ancestor = ancestor.previous
  ) {
    if (ancestor.captureName === name) return true;
  }
  return false;
};

export const getRegExpError = (pattern: string, flags: string): string | undefined => {
  const isUnicodeSets = flags.includes("v");
  const isUnicode = isUnicodeSets || flags.includes("u");
  const namedCaptures = new Map<string, number[]>();
  const namedReferences: string[] = [];
  let error: string | undefined;
  let current = END;
  let nextPosition = 0;
  let hasMore = true;
  let isForcedUnicode = false;
  let capturesStarted = 0;
  let captureCount = 0;
  let isScannedForCaptures = false;
  let hasNamedCaptures = false;
  let classDepth = 0;

  const isUnicodeMode = () => isUnicode || isForcedUnicode;

  const hasNext = () => nextPosition < pattern.length;

  const peek = () =>
    isUnicodeMode() ? (pattern.codePointAt(nextPosition) ?? END) : pattern.charCodeAt(nextPosition);

  const getNext = () => (hasNext() ? peek() : END);

  const advance = () => {
    if (!hasNext()) {
      current = END;
      nextPosition = pattern.length + 1;
      hasMore = false;
      return;
    }
    current = peek();
    nextPosition += current > 0xffff ? 2 : 1;
  };

  const advanceBy = (distance: number) => {
    nextPosition += distance - 1;
    advance();
  };

  const rewindByOneCodePoint = () => {
    if (hasMore) advanceBy(current > 0xffff ? -2 : -1);
  };

  const getPosition = () => nextPosition - (current !== END && current > 0xffff ? 2 : 1);

  const reset = (position: number) => {
    nextPosition = position;
    hasMore = position < pattern.length;
    advance();
  };

  const reportError = (message: string) => {
    if (error !== undefined) return;
    error = message;
    current = END;
    nextPosition = pattern.length;
    hasMore = false;
  };

  const scanForCaptures = (isInClass: boolean) => {
    const savedPosition = getPosition();
    let count = capturesStarted;
    while (isInClass && current !== END) {
      const character = current;
      advance();
      if (is(character, "\\")) advance();
      else if (is(character, "]")) break;
    }
    while (current !== END) {
      const character = current;
      advance();
      if (is(character, "\\")) {
        advance();
      } else if (is(character, "[")) {
        let depth = 0;
        while (current !== END) {
          const inner = current;
          advance();
          if (is(inner, "\\")) advance();
          else if (is(inner, "[") && isUnicodeSets) depth++;
          else if (is(inner, "]") && depth === 0) break;
          else if (is(inner, "]")) depth--;
        }
      } else if (is(character, "(")) {
        if (is(current, "?")) {
          advance();
          if (!is(current, "<")) continue;
          advance();
          if (is(current, "=") || is(current, "!")) continue;
          hasNamedCaptures = true;
        }
        count++;
      }
    }
    captureCount = count;
    isScannedForCaptures = true;
    reset(savedPosition);
  };

  const getHasNamedCaptures = (isInClass: boolean) => {
    if (!hasNamedCaptures && !isScannedForCaptures) scanForCaptures(isInClass);
    return hasNamedCaptures;
  };

  const parseBackReferenceIndex = () => {
    const start = getPosition();
    let value = getNext() - 0x30;
    advanceBy(2);
    while (isDecimalDigit(current)) {
      value = value * 10 + current - 0x30;
      if (value > MAX_CAPTURES) {
        reset(start);
        return undefined;
      }
      advance();
    }
    if (value > capturesStarted) {
      if (!isScannedForCaptures) scanForCaptures(false);
      if (value > captureCount) {
        reset(start);
        return undefined;
      }
    }
    return value;
  };

  const parseQuantifierNumber = () => {
    let value = 0;
    while (isDecimalDigit(current)) {
      const digit = current - 0x30;
      if (value > Math.floor((INFINITY - digit) / 10)) {
        while (isDecimalDigit(current)) advance();
        return INFINITY;
      }
      value = value * 10 + digit;
      advance();
    }
    return value;
  };

  const parseIntervalQuantifier = (): Quantifier | undefined => {
    const start = getPosition();
    advance();
    if (!isDecimalDigit(current)) {
      reset(start);
      return undefined;
    }
    const min = parseQuantifierNumber();
    if (is(current, "}")) {
      advance();
      return { min, max: min };
    }
    if (!is(current, ",")) {
      reset(start);
      return undefined;
    }
    advance();
    if (is(current, "}")) {
      advance();
      return { min, max: INFINITY };
    }
    const max = parseQuantifierNumber();
    if (!is(current, "}")) {
      reset(start);
      return undefined;
    }
    advance();
    return { min, max };
  };

  const parseOctalLiteral = () => {
    const first = current - 0x30;
    advance();
    if (!isOctalDigit(current)) return first;
    const second = first * 8 + current - 0x30;
    advance();
    if (second >= 32 || !isOctalDigit(current)) return second;
    const third = second * 8 + current - 0x30;
    advance();
    return third;
  };

  const parseHexEscape = (length: number) => {
    const start = getPosition();
    let value = 0;
    for (let index = 0; index < length; index++) {
      const digit = getHexValue(current);
      if (digit < 0) {
        reset(start);
        return undefined;
      }
      value = value * 16 + digit;
      advance();
    }
    return value;
  };

  const parseUnlimitedLengthHexNumber = () => {
    let value = 0;
    if (getHexValue(current) < 0) return undefined;
    while (getHexValue(current) >= 0) {
      value = value * 16 + getHexValue(current);
      if (value > 0x10ffff) return undefined;
      advance();
    }
    return value;
  };

  const parseUnicodeEscape = () => {
    if (is(current, "{") && isUnicodeMode()) {
      const start = getPosition();
      advance();
      const value = parseUnlimitedLengthHexNumber();
      if (value !== undefined && is(current, "}")) {
        advance();
        return value;
      }
      reset(start);
      return undefined;
    }
    const lead = parseHexEscape(4);
    if (lead === undefined || !isUnicodeMode() || !isLeadSurrogate(lead) || !is(current, "\\")) {
      return lead;
    }
    const start = getPosition();
    if (is(getNext(), "u")) {
      advanceBy(2);
      const trail = parseHexEscape(4);
      if (trail !== undefined && isTrailSurrogate(trail)) {
        return 0x10000 + ((lead - 0xd800) << 10) + (trail - 0xdc00);
      }
    }
    reset(start);
    return lead;
  };

  const readCaptureGroupName = () => {
    let name = "";
    while (true) {
      advance();
      let character = current;
      if (is(character, "\\") && is(getNext(), "u")) {
        advanceBy(2);
        const value = parseUnicodeEscape();
        if (value === undefined) {
          reportError("Invalid Unicode escape");
          return undefined;
        }
        character = value;
        rewindByOneCodePoint();
      }
      if (name !== "" && is(character, ">")) return name;
      if (!(name === "" ? isIdentifierStart(character) : isIdentifierPart(character))) {
        reportError("Invalid capture group name");
        return undefined;
      }
      name += String.fromCodePoint(character);
    }
  };

  const parseCaptureGroupName = () => {
    rewindByOneCodePoint();
    isForcedUnicode = true;
    const name = readCaptureGroupName();
    isForcedUnicode = false;
    if (name !== undefined) advance();
    return name;
  };

  const parseCharacterEscape = (isInClass: boolean) => {
    advance();
    const character = current;
    const controlEscape = CONTROL_ESCAPES.get(getCharacter(character));
    if (controlEscape !== undefined) {
      advance();
      return controlEscape;
    }
    if (is(character, "c")) {
      const controlLetter = getNext();
      const letter = controlLetter & ~0x20;
      if (letter >= 0x41 && letter <= 0x5a) {
        advanceBy(2);
        return controlLetter & 0x1f;
      }
      if (isUnicodeMode()) {
        reportError("Invalid Unicode escape");
        return 0;
      }
      if (isInClass && (isDecimalDigit(controlLetter) || is(controlLetter, "_"))) {
        advanceBy(2);
        return controlLetter & 0x1f;
      }
      return 0x5c;
    }
    if (is(character, "0") && !isDecimalDigit(getNext())) {
      advance();
      return 0;
    }
    if (isOctalDigit(character)) {
      if (isUnicodeMode()) {
        reportError("Invalid decimal escape");
        return 0;
      }
      return parseOctalLiteral();
    }
    if (is(character, "x")) {
      advance();
      const value = parseHexEscape(2);
      if (value !== undefined) return value;
      if (isUnicodeMode()) reportError("Invalid escape");
      return 0x78;
    }
    if (is(character, "u")) {
      advance();
      const value = parseUnicodeEscape();
      if (value !== undefined) return value;
      if (isUnicodeMode()) reportError("Invalid Unicode escape");
      return 0x75;
    }
    if (isUnicodeSets && isInClass && isOneOf(character, "&-!#%,:;<=>@`~")) {
      advance();
      return character;
    }
    if (isUnicodeMode()) {
      if (!isOneOf(character, "^$\\.*+?()[]{}|/")) {
        reportError("Invalid escape");
        return 0;
      }
      advance();
      return character;
    }
    advance();
    if (is(character, "k") && getHasNamedCaptures(isInClass)) reportError("Invalid escape");
    return character;
  };

  const parsePropertyCharacters = (isEnd: () => boolean) => {
    let text = "";
    for (advance(); !isEnd(); advance()) {
      const character = String.fromCharCode(current & 0xff);
      if (!PROPERTY_CHARACTER.test(character) || !hasNext()) return undefined;
      text += character;
    }
    return text;
  };

  const parsePropertyClassName = (): PropertyName | undefined => {
    if (!is(current, "{")) return undefined;
    const name = parsePropertyCharacters(() => is(current, "}") || is(current, "="));
    if (name === undefined) return undefined;
    const hasValue = is(current, "=");
    const value = hasValue ? parsePropertyCharacters(() => is(current, "}")) : "";
    if (value === undefined) return undefined;
    advance();
    return { name, value: hasValue ? value : undefined };
  };

  const getPropertyEscape = (
    property: PropertyName,
    isNegated: boolean,
  ): ClassEscape | undefined => {
    if (property.value === undefined) {
      if (
        GENERAL_CATEGORY_VALUES.has(property.name) ||
        BINARY_PROPERTIES.has(property.name) ||
        ["Any", "ASCII", "Assigned"].includes(property.name)
      ) {
        return "ranges";
      }
      return STRING_PROPERTIES.has(property.name) && isUnicodeSets && !isNegated
        ? "strings"
        : undefined;
    }
    if (["General_Category", "gc"].includes(property.name)) {
      return GENERAL_CATEGORY_VALUES.has(property.value) ? "ranges" : undefined;
    }
    return ["Script", "sc", "Script_Extensions", "scx"].includes(property.name) &&
      SCRIPT_VALUES.has(property.value)
      ? "ranges"
      : undefined;
  };

  const tryParseCharacterClassEscape = (next: number, isInClass: boolean): ClassEscape => {
    if (isOneOf(next, "dDsSwW")) {
      advanceBy(2);
      return "ranges";
    }
    if (!isOneOf(next, "pP") || !isUnicodeMode()) return "none";
    advanceBy(2);
    const property = parsePropertyClassName();
    const escape = property === undefined ? undefined : getPropertyEscape(property, is(next, "P"));
    if (escape === undefined) {
      reportError(isInClass ? "Invalid property name in character class" : "Invalid property name");
    }
    return escape ?? "ranges";
  };

  const parseClassEscape = (): ClassAtom => {
    if (!is(current, "\\")) {
      const character = current;
      advance();
      return { character, isClass: false };
    }
    const next = getNext();
    if (is(next, "b") || (is(next, "-") && isUnicodeMode())) {
      advanceBy(2);
      return { character: is(next, "b") ? 0x08 : next, isClass: false };
    }
    if (next === END) {
      reportError("\\ at end of pattern");
      return { character: 0, isClass: false };
    }
    if (tryParseCharacterClassEscape(next, true) !== "none") return { character: 0, isClass: true };
    return { character: parseCharacterEscape(true), isClass: false };
  };

  const parseClassRanges = () => {
    while (hasMore && !is(current, "]")) {
      const first = parseClassEscape();
      if (error !== undefined) return;
      if (!is(current, "-")) continue;
      advance();
      if (!hasMore || is(current, "]")) return;
      const second = parseClassEscape();
      if (error !== undefined) return;
      if (first.isClass || second.isClass) {
        if (isUnicodeMode()) reportError("Invalid character class");
        continue;
      }
      if (first.character > second.character) reportError("Range out of order in character class");
    }
  };

  const parseClassSetCharacter = () => {
    if (is(current, "\\")) {
      const next = getNext();
      if (is(next, "b")) {
        advanceBy(2);
        return 0x08;
      }
      if (next === END) {
        reportError("\\ at end of pattern");
        return 0;
      }
      return parseCharacterEscape(true);
    }
    if (isOneOf(current, "()[]{}/-\\|")) {
      reportError("Invalid character in character class");
      return 0;
    }
    if (isOneOf(current, "&!#$%*+,.:;<=>?@^`~") && getNext() === current) {
      reportError("Invalid set operation in character class");
      return 0;
    }
    const character = current;
    advance();
    return character;
  };

  const parseClassStringDisjunction = () => {
    advanceBy(2);
    if (!is(current, "{")) {
      reportError("Invalid escape");
      return false;
    }
    advance();
    let length = 0;
    let hasStrings = false;
    while (hasMore && !is(current, "}")) {
      if (is(current, "|")) {
        hasStrings ||= length !== 1;
        length = 0;
        advance();
        continue;
      }
      parseClassSetCharacter();
      if (error !== undefined) return false;
      length++;
    }
    advance();
    return hasStrings || length !== 1;
  };

  const parseClassSetOperand = (): ClassOperand => {
    if (is(current, "\\")) {
      const next = getNext();
      if (is(next, "q")) {
        return { kind: "disjunction", character: 0, hasStrings: parseClassStringDisjunction() };
      }
      const escape = tryParseCharacterClassEscape(next, true);
      if (escape !== "none") {
        return { kind: "escape", character: 0, hasStrings: escape === "strings" };
      }
    }
    if (is(current, "[")) {
      return { kind: "nested", character: 0, hasStrings: parseCharacterClass() };
    }
    return { kind: "character", character: parseClassSetCharacter(), hasStrings: false };
  };

  const parseClassUnion = (isNegated: boolean, first: ClassOperand) => {
    let hasStrings = first.hasStrings;
    let last = first;
    while (hasMore && !is(current, "]")) {
      if (!is(current, "-")) {
        last = parseClassSetOperand();
        if (error !== undefined) return false;
        hasStrings ||= last.hasStrings;
        continue;
      }
      if (is(getNext(), "-")) {
        reportError("Invalid set operation in character class");
        return false;
      }
      advance();
      if (!hasMore) break;
      if (last.kind !== "character") {
        reportError("Invalid character class");
        return false;
      }
      const to = parseClassSetOperand();
      if (error !== undefined) return false;
      if (to.kind !== "character") {
        reportError("Invalid character class");
        return false;
      }
      if (last.character > to.character) {
        reportError("Range out of order in character class");
        return false;
      }
      last = { kind: "range", character: to.character, hasStrings: false };
    }
    if (!hasMore) {
      reportError("Unterminated character class");
      return false;
    }
    advance();
    if (isNegated && hasStrings) reportError("Negated character class may contain strings");
    return hasStrings;
  };

  const parseClassIntersection = (isNegated: boolean, first: ClassOperand) => {
    let hasStrings = first.hasStrings;
    while (hasMore && !is(current, "]")) {
      if (!is(current, "&") || !is(getNext(), "&")) {
        reportError("Invalid set operation in character class");
        return false;
      }
      advanceBy(2);
      if (is(current, "&")) {
        reportError("Invalid character in character class");
        return false;
      }
      const operand = parseClassSetOperand();
      if (error !== undefined) return false;
      hasStrings &&= operand.hasStrings;
    }
    if (!hasMore) {
      reportError("Unterminated character class");
      return false;
    }
    if (isNegated && hasStrings) reportError("Negated character class may contain strings");
    advance();
    return hasStrings;
  };

  const parseClassSubtraction = (isNegated: boolean, first: ClassOperand) => {
    if (isNegated && first.hasStrings) {
      reportError("Negated character class may contain strings");
      return false;
    }
    while (hasMore && !is(current, "]")) {
      if (!is(current, "-") || !is(getNext(), "-")) {
        reportError("Invalid set operation in character class");
        return false;
      }
      advanceBy(2);
      parseClassSetOperand();
      if (error !== undefined) return false;
    }
    if (!hasMore) {
      reportError("Unterminated character class");
      return false;
    }
    advance();
    return first.hasStrings;
  };

  // Returns whether the class may contain strings, which only a class under the v flag can.
  const parseCharacterClass = (): boolean => {
    advance();
    const isNegated = is(current, "^");
    if (isNegated) advance();
    if (is(current, "]")) {
      advance();
      return false;
    }
    if (!isUnicodeSets) {
      parseClassRanges();
      if (error !== undefined) return false;
      if (!hasMore) reportError("Unterminated character class");
      advance();
      return false;
    }
    classDepth++;
    if (classDepth > MAX_CLASS_DEPTH) {
      throw new TlaTypeScriptError(
        `tla-ts can't tell whether V8 accepts the regular expression /${pattern}/${flags}`,
      );
    }
    const first = parseClassSetOperand();
    const hasStrings =
      error !== undefined
        ? false
        : is(current, "-") && is(getNext(), "-")
          ? parseClassSubtraction(isNegated, first)
          : is(current, "&") && is(getNext(), "&")
            ? parseClassIntersection(isNegated, first)
            : parseClassUnion(isNegated, first);
    classDepth--;
    return hasStrings;
  };

  let group: Group = {
    previous: undefined,
    kind: "pattern",
    captureIndex: 0,
    captureName: undefined,
    intervals: [],
  };

  const newAlternative = () => {
    if (group.captureIndex === capturesStarted) return;
    const from = group.captureIndex + 1;
    const last = group.intervals.at(-1);
    if (last !== undefined && last.to + 1 === capturesStarted) {
      group.intervals[group.intervals.length - 1] = {
        from: Math.min(last.from, from),
        to: capturesStarted,
      };
      return;
    }
    group.intervals.push({ from, to: capturesStarted });
  };

  const createNamedCapture = (closed: Group, name: string) => {
    const indices = namedCaptures.get(name) ?? [];
    const isDuplicate = indices.some((namedIndex) => {
      const interval = closed.intervals.find(
        (innerInterval) => contains(innerInterval, namedIndex) || namedIndex <= innerInterval.from,
      );
      return interval === undefined || !contains(interval, namedIndex);
    });
    if (
      isDuplicate ||
      (closed.previous !== undefined && isInsideCaptureGroup(closed.previous, name))
    ) {
      reportError("Duplicate capture group name");
      return;
    }
    namedCaptures.set(name, [...indices, closed.captureIndex]);
  };

  const parseOpenParenthesis = () => {
    const modifiers = new Set<number>();
    let kind: GroupKind = "capture";
    let isNamed = false;
    let isParsingModifiers = false;
    let isRemoving = false;
    advance();
    if (is(current, "?")) {
      do {
        const next = getNext();
        if (is(next, "-")) {
          advance();
          isParsingModifiers = true;
          if (isRemoving) {
            reportError("Multiple dashes in flag group");
            return;
          }
          isRemoving = true;
        } else if (isOneOf(next, "ims")) {
          advance();
          isParsingModifiers = true;
          if (modifiers.has(next)) {
            reportError("Repeated flag in flag group");
            return;
          }
          modifiers.add(next);
        } else if (is(next, ":")) {
          advanceBy(2);
          isParsingModifiers = false;
          kind = "grouping";
        } else if (is(next, "=") || is(next, "!")) {
          advanceBy(2);
          if (isParsingModifiers) {
            reportError("Invalid group");
            return;
          }
          kind = "lookahead";
        } else if (is(next, "<")) {
          advance();
          if (isParsingModifiers) {
            reportError("Invalid group");
            return;
          }
          if (is(getNext(), "=") || is(getNext(), "!")) {
            advanceBy(2);
            kind = "lookbehind";
          } else {
            isNamed = true;
            hasNamedCaptures = true;
            advance();
          }
        } else {
          reportError("Invalid group");
          return;
        }
      } while (isParsingModifiers);
    }
    if (isRemoving && modifiers.size === 0) {
      reportError("Invalid flag group");
      return;
    }
    if (kind === "capture") {
      if (capturesStarted >= MAX_CAPTURES) {
        reportError("Too many captures");
        return;
      }
      capturesStarted++;
    }
    const captureName = kind === "capture" && isNamed ? parseCaptureGroupName() : undefined;
    if (error !== undefined) return;
    group = {
      previous: group,
      kind,
      captureIndex: capturesStarted,
      captureName,
      intervals: [...group.intervals],
    };
  };

  const closeGroup = (): TermKind => {
    const closed = group;
    if (closed.previous === undefined) {
      reportError("Unmatched ')'");
      return "none";
    }
    advance();
    if (closed.captureName !== undefined) createNamedCapture(closed, closed.captureName);
    group = closed.previous;
    return closed.kind === "lookahead" || closed.kind === "lookbehind" ? closed.kind : "atom";
  };

  const parseNamedBackReference = () => {
    if (!is(current, "<")) {
      reportError("Invalid named reference");
      return;
    }
    advance();
    const name = parseCaptureGroupName();
    if (name !== undefined && !isInsideCaptureGroup(group, name)) namedReferences.push(name);
  };

  const parseLegacyOctalEscape = (): TermKind => {
    advance();
    if (isUnicodeMode() && isDecimalDigit(getNext())) {
      reportError("Invalid decimal escape");
      return "none";
    }
    parseOctalLiteral();
    return "atom";
  };

  const parseAtomEscape = (): TermKind => {
    const next = getNext();
    if (next === END) {
      reportError("\\ at end of pattern");
      return "none";
    }
    if (isDecimalDigit(next) && !is(next, "0")) {
      if (parseBackReferenceIndex() !== undefined) return "atom";
      if (isUnicodeMode()) {
        reportError("Invalid escape");
        return "none";
      }
      if (isOneOf(getNext(), "89")) {
        advanceBy(2);
        return "atom";
      }
      return parseLegacyOctalEscape();
    }
    if (is(next, "0")) return parseLegacyOctalEscape();
    if (isOneOf(next, "bB")) {
      advanceBy(2);
      return "none";
    }
    if (isOneOf(next, "dDsSwWpP")) {
      if (tryParseCharacterClassEscape(next, false) === "none") advanceBy(2);
      return "atom";
    }
    if (is(next, "k") && (getHasNamedCaptures(false) || isUnicodeMode())) {
      advanceBy(2);
      parseNamedBackReference();
      return "atom";
    }
    parseCharacterEscape(false);
    return "atom";
  };

  const parseTerm = (): TermKind => {
    switch (getCharacter(current)) {
      case ")":
        return closeGroup();
      case "|":
        advance();
        newAlternative();
        return "none";
      case "*":
      case "+":
      case "?":
        reportError("Nothing to repeat");
        return "none";
      case "^":
      case "$":
        advance();
        return "none";
      case "(":
        parseOpenParenthesis();
        return "none";
      case "[":
        parseCharacterClass();
        return "atom";
      case "\\":
        return parseAtomEscape();
      case "{":
      case "}":
      case "]":
        if (is(current, "{") && parseIntervalQuantifier() !== undefined) {
          reportError("Nothing to repeat");
          return "none";
        }
        if (isUnicodeMode()) {
          reportError("Lone quantifier brackets");
          return "none";
        }
        advance();
        return "atom";
      default:
        advance();
        return "atom";
    }
  };

  const parseQuantifier = (term: TermKind) => {
    if (isOneOf(current, "*+?")) {
      advance();
    } else if (is(current, "{")) {
      const quantifier = parseIntervalQuantifier();
      if (quantifier === undefined) {
        if (isUnicodeMode()) reportError("Incomplete quantifier");
        return;
      }
      if (quantifier.max < quantifier.min) {
        reportError("numbers out of order in {} quantifier");
        return;
      }
    } else {
      return;
    }
    if (is(current, "?")) advance();
    if (term === "lookbehind" || (term === "lookahead" && isUnicodeMode())) {
      reportError("Invalid quantifier");
    }
  };

  advance();
  while (error === undefined && current !== END) {
    const term = parseTerm();
    if (term !== "none") parseQuantifier(term);
  }
  if (error === undefined && group.previous !== undefined) reportError("Unterminated group");
  if (error === undefined && namedReferences.some((name) => !namedCaptures.has(name))) {
    reportError("Invalid named capture referenced");
  }
  return error;
};
