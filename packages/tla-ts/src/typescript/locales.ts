// IsStructurallyValidLanguageTag of ECMA-402: whether a tag is a Unicode BCP 47 locale identifier
// of UTS 35, without its backwards compatibility syntax, and without a duplicate variant or
// singleton. It reads no locale data. It gives undefined for a tag whose Unicode extension repeats a
// key, where V8 accepts some tags that the grammar doesn't.
const LANGUAGE = /^(?:[a-z]{2,3}|[a-z]{5,8})$/;
const SCRIPT = /^[a-z]{4}$/;
const REGION = /^(?:[a-z]{2}|[0-9]{3})$/;
const VARIANT = /^(?:[a-z0-9]{5,8}|[0-9][a-z0-9]{3})$/;
const TYPE = /^[a-z0-9]{3,8}$/;

// The position after a language identifier that starts at a position, or -1 where none does or
// where it repeats a variant.
const getLanguageEnd = (subtags: readonly string[], start: number) => {
  if (!LANGUAGE.test(subtags[start] ?? "")) return -1;
  const afterScript = SCRIPT.test(subtags[start + 1] ?? "") ? start + 2 : start + 1;
  const afterRegion = REGION.test(subtags[afterScript] ?? "") ? afterScript + 1 : afterScript;
  const variantCount = subtags.slice(afterRegion).findIndex((subtag) => !VARIANT.test(subtag));
  const end = variantCount === -1 ? subtags.length : afterRegion + variantCount;
  const variants = subtags.slice(afterRegion, end);
  return new Set(variants).size === variants.length ? end : -1;
};

// The position after the subtags of an extension whose singleton is at a position, or -1 where
// they aren't valid.
const getExtensionEnd = (subtags: readonly string[], start: number) => {
  const singleton = subtags[start];
  const end = subtags.findIndex((subtag, position) => position > start && subtag.length === 1);
  const last = end === -1 ? subtags.length : end;
  const rest = subtags.slice(start + 1, last);
  if (singleton === "x") {
    return subtags.length > start + 1 &&
      subtags.slice(start + 1).every((subtag) => /^[a-z0-9]{1,8}$/.test(subtag))
      ? subtags.length
      : -1;
  }
  if (rest.length === 0) return -1;
  if (singleton === "u") {
    const keyStart = rest.findIndex((subtag) => !TYPE.test(subtag));
    const keywords = keyStart === -1 ? [] : rest.slice(keyStart);
    return (keywords.length === 0 || /^[a-z0-9][a-z]$/.test(keywords[0])) &&
      keywords.every((subtag) => TYPE.test(subtag) || /^[a-z0-9][a-z]$/.test(subtag))
      ? last
      : -1;
  }
  if (singleton === "t") {
    const languageEnd = LANGUAGE.test(rest[0]) ? getLanguageEnd(rest, 0) : 0;
    const fields = languageEnd === -1 ? [] : rest.slice(languageEnd);
    return languageEnd !== -1 &&
      (fields.length === 0 || /^[a-z][0-9]$/.test(fields[0])) &&
      fields.every(
        (subtag, position) =>
          TYPE.test(subtag) ||
          (/^[a-z][0-9]$/.test(subtag) && TYPE.test(fields[position + 1] ?? "")),
      )
      ? last
      : -1;
  }
  return rest.every((subtag) => /^[a-z0-9]{2,8}$/.test(subtag)) ? last : -1;
};

export const isStructurallyValidLanguageTag = (tag: string): boolean | undefined => {
  if (!/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/.test(tag)) return false;
  const subtags = tag.toLowerCase().split("-");
  const languageEnd = getLanguageEnd(subtags, 0);
  if (languageEnd === -1) return false;
  const visit = (start: number, singletons: ReadonlySet<string>): boolean => {
    if (start === subtags.length) return true;
    const singleton = subtags[start];
    if (singleton.length !== 1 || singletons.has(singleton)) return false;
    const end = getExtensionEnd(subtags, start);
    return end !== -1 && visit(end, new Set([...singletons, singleton]));
  };
  const extension = subtags.indexOf("u", languageEnd);
  const privateUse = subtags.indexOf("x", languageEnd);
  const keys = subtags
    .slice(extension + 1)
    .filter(
      (subtag, position) =>
        extension !== -1 &&
        (privateUse === -1 || extension + 1 + position < privateUse) &&
        subtag.length === 2,
    );
  return extension !== -1 && new Set(keys).size !== keys.length
    ? undefined
    : visit(languageEnd, new Set());
};

// A value that a literal gives, which converts without running code.
export type LiteralValue = string | number | boolean | undefined;

// What new of an Intl constructor throws, "" where it throws nothing, or undefined where that
// depends on what tla-ts doesn't model, such as locale data or a unit's identifier.
type IntlOutcome = "RangeError" | "TypeError" | "" | undefined;

type Options = ReadonlyMap<string, LiteralValue>;

type Check = (options: Options) => IntlOutcome;

// The first of the outcomes in turn that throws or that tla-ts can't tell.
const getFirst = (outcomes: readonly IntlOutcome[]) => {
  const index = outcomes.findIndex((outcome) => outcome !== "");
  return index === -1 ? "" : outcomes[index];
};

// The Unicode locale nonterminal type, which a collation, a calendar, or a numbering system
// matches.
const isUnicodeType = (value: string) => /^[a-z0-9]{3,8}(?:-[a-z0-9]{3,8})*$/i.test(value);

// GetOption of a string among values, or of any string that a test accepts.
const getString =
  (key: string, isAllowed: (value: string) => boolean, isRequired = false): Check =>
  (options) => {
    const value = options.get(key);
    if (value === undefined) return isRequired ? "TypeError" : "";
    return isAllowed(String(value)) ? "" : "RangeError";
  };

const getEnum = (key: string, values: readonly string[], isRequired = false) =>
  getString(key, (value) => values.includes(value), isRequired);

// DefaultNumberOption, through GetNumberOption.
const isNumberIn = (value: LiteralValue, minimum: number, maximum: number) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum;
};

const getNumber =
  (key: string, minimum: number, maximum: number): Check =>
  (options) =>
    options.get(key) === undefined || isNumberIn(options.get(key), minimum, maximum)
      ? ""
      : "RangeError";

const LOCALE_MATCHER = getEnum("localeMatcher", ["lookup", "best fit"]);

const NUMBERING_SYSTEM = getString("numberingSystem", isUnicodeType);

// SetNumberFormatDigitOptions, which reads the digits only where they don't meet a currency's
// digits, which locale data gives.
const DIGITS: Check = (options) => {
  const minimumFraction = options.get("minimumFractionDigits");
  const maximumFraction = options.get("maximumFractionDigits");
  const minimumSignificant = options.get("minimumSignificantDigits");
  const maximumSignificant = options.get("maximumSignificantDigits");
  const priority = options.get("roundingPriority");
  const hasSignificant = minimumSignificant !== undefined || maximumSignificant !== undefined;
  const hasFraction = minimumFraction !== undefined || maximumFraction !== undefined;
  const isAuto = priority === undefined || String(priority) === "auto";
  const significantError =
    (!isAuto || hasSignificant) &&
    hasSignificant &&
    (!(minimumSignificant === undefined || isNumberIn(minimumSignificant, 1, 21)) ||
      !(
        maximumSignificant === undefined ||
        isNumberIn(
          maximumSignificant,
          minimumSignificant === undefined ? 1 : Math.trunc(Number(minimumSignificant)),
          21,
        )
      ));
  const fractionError =
    (!isAuto || !hasSignificant) &&
    hasFraction &&
    (!(minimumFraction === undefined || isNumberIn(minimumFraction, 0, 100)) ||
      !(maximumFraction === undefined || isNumberIn(maximumFraction, 0, 100)) ||
      (minimumFraction !== undefined &&
        maximumFraction !== undefined &&
        Math.trunc(Number(minimumFraction)) > Math.trunc(Number(maximumFraction))));
  return getFirst([
    getNumber("minimumIntegerDigits", 1, 21)(options),
    options.get("roundingIncrement") === undefined ? "" : undefined,
    getEnum("roundingMode", [
      "ceil",
      "floor",
      "expand",
      "trunc",
      "halfCeil",
      "halfFloor",
      "halfExpand",
      "halfTrunc",
      "halfEven",
    ])(options),
    getEnum("roundingPriority", ["auto", "morePrecision", "lessPrecision"])(options),
    getEnum("trailingZeroDisplay", ["auto", "stripIfInteger"])(options),
    significantError || fractionError ? "RangeError" : "",
  ]);
};

// The checks of each constructor's options, in the order it reads them, after it reads its
// locales, and the options it reads that tla-ts doesn't check.
const CONSTRUCTORS: Record<string, { checks: readonly Check[]; unchecked: readonly string[] }> = {
  Collator: {
    checks: [
      getEnum("usage", ["sort", "search"]),
      LOCALE_MATCHER,
      getString("collation", isUnicodeType),
      getEnum("caseFirst", ["upper", "lower", "false"]),
      getEnum("sensitivity", ["base", "accent", "case", "variant"]),
    ],
    unchecked: [],
  },
  NumberFormat: {
    checks: [
      LOCALE_MATCHER,
      NUMBERING_SYSTEM,
      getEnum("style", ["decimal", "percent", "currency", "unit"]),
      (options) => {
        const currency = options.get("currency");
        return currency === undefined
          ? String(options.get("style")) === "currency"
            ? "TypeError"
            : ""
          : /^[A-Za-z]{3}$/.test(String(currency))
            ? ""
            : "RangeError";
      },
      getEnum("currencyDisplay", ["code", "symbol", "narrowSymbol", "name"]),
      getEnum("currencySign", ["standard", "accounting"]),
      (options) =>
        options.get("unit") === undefined
          ? String(options.get("style")) === "unit"
            ? "TypeError"
            : ""
          : undefined,
      getEnum("unitDisplay", ["short", "narrow", "long"]),
      getEnum("notation", ["standard", "scientific", "engineering", "compact"]),
      DIGITS,
      getEnum("compactDisplay", ["short", "long"]),
      (options) => {
        const value = options.get("useGrouping");
        return value === undefined ||
          value === true ||
          !value ||
          ["min2", "auto", "always", "true", "false"].includes(String(value))
          ? ""
          : "RangeError";
      },
      getEnum("signDisplay", ["auto", "never", "always", "exceptZero", "negative"]),
    ],
    unchecked: [],
  },
  DateTimeFormat: {
    checks: [
      LOCALE_MATCHER,
      getString("calendar", isUnicodeType),
      NUMBERING_SYSTEM,
      getEnum("hourCycle", ["h11", "h12", "h23", "h24"]),
      getEnum("formatMatcher", ["basic", "best fit"]),
    ],
    unchecked: [
      "timeZone",
      "weekday",
      "era",
      "year",
      "month",
      "day",
      "dayPeriod",
      "hour",
      "minute",
      "second",
      "fractionalSecondDigits",
      "timeZoneName",
      "dateStyle",
      "timeStyle",
    ],
  },
  PluralRules: {
    checks: [LOCALE_MATCHER, getEnum("type", ["cardinal", "ordinal"]), DIGITS],
    unchecked: [],
  },
  RelativeTimeFormat: {
    checks: [
      LOCALE_MATCHER,
      NUMBERING_SYSTEM,
      getEnum("style", ["long", "short", "narrow"]),
      getEnum("numeric", ["always", "auto"]),
    ],
    unchecked: [],
  },
  ListFormat: {
    checks: [
      LOCALE_MATCHER,
      getEnum("type", ["conjunction", "disjunction", "unit"]),
      getEnum("style", ["long", "short", "narrow"]),
    ],
    unchecked: [],
  },
  Segmenter: {
    checks: [LOCALE_MATCHER, getEnum("granularity", ["grapheme", "word", "sentence"])],
    unchecked: [],
  },
  DisplayNames: {
    checks: [
      LOCALE_MATCHER,
      getEnum("style", ["narrow", "short", "long"]),
      getEnum(
        "type",
        ["language", "region", "script", "currency", "calendar", "dateTimeField"],
        true,
      ),
      getEnum("fallback", ["code", "none"]),
      getEnum("languageDisplay", ["dialect", "standard"]),
    ],
    unchecked: [],
  },
  DurationFormat: {
    checks: [
      LOCALE_MATCHER,
      NUMBERING_SYSTEM,
      getEnum("style", ["long", "short", "narrow", "digital"]),
      getNumber("fractionalDigits", 0, 9),
    ],
    unchecked: [
      "years",
      "months",
      "weeks",
      "days",
      "hours",
      "minutes",
      "seconds",
      "milliseconds",
      "microseconds",
      "nanoseconds",
    ].flatMap((unit) => [unit, `${unit}Display`]),
  },
  Locale: {
    checks: [
      getString("language", (value) => /^(?:[A-Za-z]{2,3}|[A-Za-z]{5,8})$/.test(value)),
      getString("script", (value) => /^[A-Za-z]{4}$/.test(value)),
      getString("region", (value) => /^(?:[A-Za-z]{2}|[0-9]{3})$/.test(value)),
      getString("calendar", isUnicodeType),
      getString("collation", isUnicodeType),
      getString("firstDayOfWeek", (value) => /^[0-7]$/.test(value) || isUnicodeType(value)),
      getEnum("hourCycle", ["h11", "h12", "h23", "h24"]),
      getEnum("caseFirst", ["upper", "lower", "false"]),
      NUMBERING_SYSTEM,
    ],
    unchecked: ["variants"],
  },
};

// The tags of literal locales, or undefined where CanonicalizeLocaleList reads the length of the
// object that a number or a boolean converts to. Locale takes one tag.
const getTags = (name: string, locales: LiteralValue | readonly LiteralValue[]) =>
  name !== "Locale" && (typeof locales === "number" || typeof locales === "boolean")
    ? undefined
    : name === "Locale" || !Array.isArray(locales)
      ? locales === undefined && name !== "Locale"
        ? []
        : [locales]
      : locales;

const getTagOutcome = (tag: LiteralValue): IntlOutcome => {
  if (typeof tag !== "string") return "TypeError";
  const isValid = isStructurallyValidLanguageTag(tag);
  return isValid === undefined ? undefined : isValid ? "" : "RangeError";
};

// What new of an Intl constructor throws for literal locales, or a Locale's literal tag, and
// literal options: CanonicalizeLocaleList, or the Locale constructor, reads the tags first.
export const getIntlOutcome = (
  name: string,
  locales: LiteralValue | readonly LiteralValue[],
  options: Options,
): IntlOutcome => {
  const constructor = CONSTRUCTORS[name];
  const tags = getTags(name, locales);
  if (constructor === undefined || tags === undefined) return undefined;
  const outcome = getFirst([
    ...tags.map(getTagOutcome),
    ...constructor.checks.map((check) => check(options)),
  ]);
  return outcome === "" && constructor.unchecked.some((key) => options.get(key) !== undefined)
    ? undefined
    : outcome;
};

// What Intl.getCanonicalLocales, or a constructor's supportedLocalesOf, throws for literal locales
// and options, or "" where it gives an empty array as they name no locales. Where they name one,
// what it gives depends on locale data.
export const getLocalesOutcome = (
  locales: LiteralValue | readonly LiteralValue[],
  options: Options,
): IntlOutcome => {
  const tags = getTags("", locales);
  if (tags === undefined) return undefined;
  const outcome = getFirst([...tags.map(getTagOutcome), LOCALE_MATCHER(options)]);
  return outcome === "" && tags.length > 0 ? undefined : outcome;
};

// The locale that ResolveLocale gives for literal locales that name no locale or English, as Node
// does under the default locale en-US, or undefined for any other, whose resolution reads locale
// data.
const getResolvedLocale = (name: string, locales: LiteralValue | readonly LiteralValue[]) => {
  const tags = getTags(name, locales);
  if (tags === undefined || tags.length > 1) return undefined;
  const tag = tags.length === 0 ? "en-us" : tags[0];
  return tag === undefined || typeof tag !== "string"
    ? undefined
    : tag.toLowerCase() === "en"
      ? "en"
      : tag.toLowerCase() === "en-us"
        ? "en-US"
        : undefined;
};

type Resolved = readonly (readonly [string, string | boolean | number])[];

// The resolved options of a constructor, in the order resolvedOptions writes them, with the
// defaults that English gives, from the options that it reads without locale data.
const RESOLVED: Record<
  string,
  { read: readonly string[]; resolve: (options: Options) => Resolved }
> = {
  ListFormat: {
    read: ["type", "style"],
    resolve: (options) => [
      ["type", String(options.get("type") ?? "conjunction")],
      ["style", String(options.get("style") ?? "long")],
    ],
  },
  RelativeTimeFormat: {
    read: ["style", "numeric"],
    resolve: (options) => [
      ["style", String(options.get("style") ?? "long")],
      ["numeric", String(options.get("numeric") ?? "always")],
      ["numberingSystem", "latn"],
    ],
  },
  Segmenter: {
    read: ["granularity"],
    resolve: (options) => [["granularity", String(options.get("granularity") ?? "grapheme")]],
  },
  Collator: {
    read: ["usage", "sensitivity", "ignorePunctuation", "numeric", "caseFirst"],
    resolve: (options) => [
      ["usage", String(options.get("usage") ?? "sort")],
      ["sensitivity", String(options.get("sensitivity") ?? "variant")],
      ["ignorePunctuation", Boolean(options.get("ignorePunctuation") ?? false)],
      ["collation", "default"],
      ["numeric", Boolean(options.get("numeric") ?? false)],
      ["caseFirst", String(options.get("caseFirst") ?? "false")],
    ],
  },
  DisplayNames: {
    read: ["style", "type", "fallback", "languageDisplay"],
    resolve: (options) => [
      ["style", String(options.get("style") ?? "long")],
      ["type", String(options.get("type"))],
      ["fallback", String(options.get("fallback") ?? "code")],
      ...(String(options.get("type")) === "language"
        ? [["languageDisplay", String(options.get("languageDisplay") ?? "dialect")] as const]
        : []),
    ],
  },
  NumberFormat: {
    read: ["style", "signDisplay", "roundingMode", "trailingZeroDisplay"],
    resolve: (options) => [
      ["numberingSystem", "latn"],
      ["style", String(options.get("style") ?? "decimal")],
      ["minimumIntegerDigits", 1],
      ["minimumFractionDigits", 0],
      ["maximumFractionDigits", String(options.get("style")) === "percent" ? 0 : 3],
      ["useGrouping", "auto"],
      ["notation", "standard"],
      ["signDisplay", String(options.get("signDisplay") ?? "auto")],
      ["roundingIncrement", 1],
      ["roundingMode", String(options.get("roundingMode") ?? "halfExpand")],
      ["roundingPriority", "auto"],
      ["trailingZeroDisplay", String(options.get("trailingZeroDisplay") ?? "auto")],
    ],
  },
  DateTimeFormat: {
    read: [],
    resolve: () => [
      ["calendar", "gregory"],
      ["numberingSystem", "latn"],
      ["timeZone", "UTC"],
      ["year", "numeric"],
      ["month", "numeric"],
      ["day", "numeric"],
    ],
  },
};

// What resolvedOptions gives for an object of literal locales and options that new of an Intl
// constructor accepts, or undefined where that reads locale data that tla-ts doesn't hold, as a
// NumberFormat's of a currency or a unit does. The time zone of a DateTimeFormat is the one that
// tla-ts takes local time in.
export const getResolvedOptions = (
  name: string,
  locales: LiteralValue | readonly LiteralValue[],
  options: Options,
): Resolved | undefined => {
  const locale = getResolvedLocale(name, locales);
  const resolved = RESOLVED[name];
  const style = options.get("style");
  return locale === undefined ||
    resolved === undefined ||
    [...options.keys()].some((key) => key !== "localeMatcher" && !resolved.read.includes(key)) ||
    (name === "NumberFormat" &&
      style !== undefined &&
      !["decimal", "percent"].includes(String(style)))
    ? undefined
    : [["locale", locale], ...resolved.resolve(options)];
};
