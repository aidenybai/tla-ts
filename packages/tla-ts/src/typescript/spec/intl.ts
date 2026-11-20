import ts from "@typescript/typescript6";
import { getUnitsOf } from "./runtime";

type Validator = (value: unknown) => boolean;

// The literals that a program writes, which its Intl objects may take as locales, options, and
// arguments, as test262's tests and most programs write them.
interface Literals {
  strings: Set<string>;
  // The strings that are a call's arguments, an array literal's elements, or a method's receiver.
  arguments: Set<string>;
  // Each number by its key, which tells -0 from 0.
  numbers: Map<string, number>;
  bigints: Set<string>;
  // The time values of the dates that Date's constructor and Date.UTC make of literals.
  times: Set<number>;
  // The Temporal objects that Temporal's constructors and methods make of literals, each with the
  // key of ESCore's HostIntl entries for it.
  temporals: Map<string, object>;
  // The durations that object literals, strings, and Temporal's methods make of literals, by the
  // key of ESCore's HostIntl entries for them.
  durations: Map<string, unknown>;
  // The lists of strings that array literals write.
  lists: string[][];
  objects: ts.ObjectLiteralExpression[];
  // The locales that each call of a service names, by its service: a literal, a list of them, or
  // undefined, and whether a call names others.
  locales: Map<string, (string | string[] | undefined)[]>;
  openLocales: Set<string>;
}

// A service of Intl that HostIntl answers for: the options its constructor reads, by the values a
// literal may give each, the methods whose words make the program record its answers, and its
// constructor's name in another built-in's call.
interface Service {
  name: string;
  options: Record<string, Validator>;
  // The key of an object in HostIntl's entries but for its requested locales, from the options
  // its constructor read and what its resolvedOptions gives, or undefined where ESCore keeps none.
  getConfig: (bag: Record<string, unknown>, resolved: Record<string, unknown>) => string;
  // The entries of an object's methods for the arguments the program's literals make.
  getMethods: (
    object: never,
    literals: Literals,
    words: ReadonlySet<string>,
  ) => Map<string, string>;
  callers: string[];
  // How ESCore holds an option it read where that isn't as a string's units or a Boolean.
  encoders?: Record<string, (value: unknown) => string | undefined>;
}

const isOneOf =
  (...values: string[]): Validator =>
  (value) =>
    values.includes(String(value));
const isInteger: Validator = (value) => Number.isInteger(value);
const isTypeSequence: Validator = (value) =>
  typeof value === "string" && /^[a-z0-9]{3,8}(?:-[a-z0-9]{3,8})*$/i.test(value);
const isBoolean: Validator = (value) => typeof value === "boolean";

const MATCHER = { localeMatcher: isOneOf("lookup", "best fit") };
const DIGITS = {
  minimumIntegerDigits: isInteger,
  minimumFractionDigits: isInteger,
  maximumFractionDigits: isInteger,
  minimumSignificantDigits: isInteger,
  maximumSignificantDigits: isInteger,
  roundingIncrement: isInteger,
  roundingMode: isOneOf(
    "ceil",
    "floor",
    "expand",
    "trunc",
    "halfCeil",
    "halfFloor",
    "halfExpand",
    "halfTrunc",
    "halfEven",
  ),
  roundingPriority: isOneOf("auto", "morePrecision", "lessPrecision"),
  trailingZeroDisplay: isOneOf("auto", "stripIfInteger"),
};

const MOST_BAGS_PER_LITERAL = 256;
const MOST_ENTRIES = 2500;
const TABLE_SIZE = 200;

const getNumberKey = (value: number) => (Object.is(value, -0) ? "-0" : String(value));

// What a call of the host gives, or undefined where it throws.
const attempt = <T>(run: () => T) => {
  try {
    return run();
  } catch {
    return undefined;
  }
};

const OPERATORS: Record<number, (left: number, right: number) => number | string> = {
  [ts.SyntaxKind.PlusToken]: (left, right) => left + right,
  [ts.SyntaxKind.MinusToken]: (left, right) => left - right,
  [ts.SyntaxKind.AsteriskToken]: (left, right) => left * right,
  [ts.SyntaxKind.SlashToken]: (left, right) => left / right,
  [ts.SyntaxKind.PercentToken]: (left, right) => left % right,
  [ts.SyntaxKind.AsteriskAsteriskToken]: (left, right) => left ** right,
};
const NUMBER_CONSTANTS = new Set([
  "MAX_SAFE_INTEGER",
  "MIN_SAFE_INTEGER",
  "MAX_VALUE",
  "MIN_VALUE",
  "EPSILON",
  "POSITIVE_INFINITY",
  "NEGATIVE_INFINITY",
  "NaN",
]);

// A numeric literal's value, whose separators Number doesn't read.
const getNumber = (text: string) => Number(text.replaceAll("_", ""));

const getLiteralValue = (node: ts.Expression): { value: unknown } | undefined => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return { value: node.text };
  }
  if (ts.isNumericLiteral(node)) return { value: getNumber(node.text) };
  if (ts.isBigIntLiteral(node))
    return { value: BigInt(node.text.slice(0, -1).replaceAll("_", "")) };
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const operand = getLiteralValue(node.operand)?.value;
    return typeof operand === "bigint" || typeof operand === "number"
      ? { value: typeof operand === "bigint" ? -operand : -operand }
      : undefined;
  }
  if (ts.isParenthesizedExpression(node)) return getLiteralValue(node.expression);
  // Arithmetic of numbers and joins of strings that are literals, as the host computes them.
  if (ts.isBinaryExpression(node) && Object.hasOwn(OPERATORS, node.operatorToken.kind)) {
    const left = getLiteralValue(node.left)?.value;
    const right = getLiteralValue(node.right)?.value;
    const isNumbers = typeof left === "number" && typeof right === "number";
    const isJoin =
      node.operatorToken.kind === ts.SyntaxKind.PlusToken &&
      (typeof left === "string" || typeof left === "number") &&
      (typeof right === "string" || typeof right === "number");
    return isNumbers || isJoin
      ? { value: OPERATORS[node.operatorToken.kind](left as never, right as never) }
      : undefined;
  }
  if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
    return node.expression.text === "Number" && NUMBER_CONSTANTS.has(node.name.text)
      ? { value: Reflect.get(Number, node.name.text) }
      : undefined;
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { value: true };
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { value: false };
  if (ts.isIdentifier(node)) {
    return node.text === "undefined"
      ? { value: undefined }
      : node.text === "Infinity"
        ? { value: Infinity }
        : node.text === "NaN"
          ? { value: Number.NaN }
          : undefined;
  }
  return undefined;
};

const getStringList = (node: ts.Expression) => {
  if (!ts.isArrayLiteralExpression(node)) return undefined;
  const values = node.elements.map((element) =>
    ts.isExpression(element) ? getLiteralValue(element)?.value : undefined,
  );
  return values.every((value) => typeof value === "string") ? (values as string[]) : undefined;
};

const getCalleeName = (node: ts.NewExpression | ts.CallExpression) =>
  ts.isPropertyAccessExpression(node.expression)
    ? node.expression.name.text
    : ts.isIdentifier(node.expression)
      ? node.expression.text
      : "";

// The value of an expression of literals and Temporal's constructors and methods, which runs no code
// of the program's, as the host's Temporal gives it, or undefined where it isn't one or throws.
const getTemporal = (node: ts.Expression): { value: unknown } | undefined => {
  const temporal: unknown = Reflect.get(globalThis, "Temporal");
  if (typeof temporal !== "object" || temporal === null) return undefined;
  const evaluate = (inner: ts.Expression): { value: unknown } | undefined => {
    const literal = getLiteralValue(inner);
    if (literal !== undefined) return literal;
    if (ts.isParenthesizedExpression(inner)) return evaluate(inner.expression);
    if (ts.isIdentifier(inner)) return inner.text === "Temporal" ? { value: temporal } : undefined;
    if (ts.isObjectLiteralExpression(inner)) {
      const entries = inner.properties.flatMap((property) => {
        if (
          !ts.isPropertyAssignment(property) ||
          !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))
        ) {
          return [];
        }
        const evaluated = evaluate(property.initializer);
        return evaluated === undefined ? [] : [[property.name.text, evaluated.value]];
      });
      return entries.length === inner.properties.length
        ? { value: Object.fromEntries(entries) }
        : undefined;
    }
    if (ts.isPropertyAccessExpression(inner)) {
      const target = evaluate(inner.expression);
      return target === undefined || typeof target.value !== "object" || target.value === null
        ? undefined
        : { value: Reflect.get(target.value, inner.name.text) };
    }
    if (ts.isNewExpression(inner) || ts.isCallExpression(inner)) {
      const args = (inner.arguments ?? []).map(evaluate);
      if (args.some((arg) => arg === undefined)) return undefined;
      const values = args.map((arg) => arg?.value);
      if (ts.isNewExpression(inner)) {
        const callee = evaluate(inner.expression);
        return typeof callee?.value === "function"
          ? { value: Reflect.construct(callee.value, values) }
          : undefined;
      }
      if (!ts.isPropertyAccessExpression(inner.expression)) return undefined;
      const target = evaluate(inner.expression.expression);
      if (
        target === undefined ||
        (typeof target.value !== "object" && typeof target.value !== "function")
      ) {
        return undefined;
      }
      const method: unknown = Reflect.get(target.value as object, inner.expression.name.text);
      return typeof method === "function"
        ? { value: Reflect.apply(method, target.value, values) }
        : undefined;
    }
    return undefined;
  };
  try {
    return evaluate(node);
  } catch {
    return undefined;
  }
};

// The key of ESCore's HostIntl entries for a Temporal object (TemporalFormatKey): its kind, its
// ISO fields or its epoch nanoseconds, its time zone's identifier, and its calendar.
const getTemporalKey = (value: unknown) => {
  if (typeof value !== "object" || value === null) return undefined;
  const kind = /^\[object Temporal\.(\w+)\]$/.exec(Object.prototype.toString.call(value))?.[1];
  const get = (key: string) => Reflect.get(value, key);
  const getIso = () => {
    const match = /^([+-]?\d{4,6})-(\d\d)-(\d\d)/.exec(
      String(Reflect.apply(get("toString"), value, [{ calendarName: "always" }])),
    );
    return match === null ? [] : [Number(match[1]), Number(match[2]), Number(match[3])];
  };
  const time = ["hour", "minute", "second", "millisecond", "microsecond", "nanosecond"];
  const calendar = () => getUnitsOf(String(get("calendarId")));
  if (kind === "PlainDate" || kind === "PlainYearMonth" || kind === "PlainMonthDay") {
    return `<<"${kind}", ${getIso().join(", ")}, ${calendar()}>>`;
  }
  if (kind === "PlainDateTime") {
    const iso = Reflect.apply(get("withCalendar"), value, ["iso8601"]) as object;
    return `<<"${kind}", ${["year", "month", "day", ...time].map((key) => String(Reflect.get(iso, key))).join(", ")}, ${calendar()}>>`;
  }
  if (kind === "PlainTime")
    return `<<"${kind}", ${time.map((key) => String(get(key))).join(", ")}>>`;
  if (kind === "ZonedDateTime") {
    return `<<"${kind}", ${getUnitsOf(String(get("epochNanoseconds")))}, ${getUnitsOf(String(get("timeZoneId")))}, ${calendar()}>>`;
  }
  if (kind === "Instant") return `<<"${kind}", ${getUnitsOf(String(get("epochNanoseconds")))}>>`;
  return undefined;
};

// The key of ESCore's HostIntl entries for the duration that Temporal reads of a value, the units
// of its fields from years to nanoseconds, or undefined where Temporal reads none.
const DURATION_FIELDS = [
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
];
const getDurationKey = (value: unknown) => {
  const temporal: unknown = Reflect.get(globalThis, "Temporal");
  if (typeof temporal !== "object" || temporal === null) return undefined;
  if (typeof value !== "string" && (typeof value !== "object" || value === null)) return undefined;
  const duration = attempt(
    () =>
      Reflect.apply(Reflect.get(Reflect.get(temporal, "Duration"), "from"), undefined, [
        value,
      ]) as object,
  );
  return duration === undefined
    ? undefined
    : `<<"duration", <<${DURATION_FIELDS.map((field) => getUnitsOf(BigInt(Reflect.get(duration, field)).toString())).join(", ")}>>>>`;
};

const getLiterals = (sourceFiles: readonly ts.SourceFile[]) => {
  const literals: Literals = {
    strings: new Set(),
    arguments: new Set(),
    numbers: new Map(
      [0, -0, 1, -1, Number.NaN, Infinity, -Infinity].map((value) => [getNumberKey(value), value]),
    ),
    bigints: new Set(),
    times: new Set(),
    temporals: new Map(),
    durations: new Map(),
    lists: [[]],
    objects: [],
    locales: new Map(),
    openLocales: new Set(),
  };
  const subclasses = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if ((ts.isClassDeclaration(node) || ts.isClassExpression(node)) && node.name !== undefined) {
      const base = node.heritageClauses?.[0]?.types[0]?.expression;
      if (base !== undefined && ts.isPropertyAccessExpression(base)) {
        subclasses.set(node.name.text, base.name.text);
      }
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      literals.strings.add(node.text);
      const duration = getDurationKey(node.text);
      if (duration !== undefined) literals.durations.set(duration, node.text);
      if (
        ts.isArrayLiteralExpression(node.parent) ||
        (ts.isPropertyAccessExpression(node.parent) && node.parent.expression === node) ||
        ((ts.isCallExpression(node.parent) || ts.isNewExpression(node.parent)) &&
          node.parent.arguments?.includes(node))
      ) {
        literals.arguments.add(node.text);
      }
    } else if (
      ts.isNumericLiteral(node) ||
      ts.isBinaryExpression(node) ||
      ts.isPropertyAccessExpression(node)
    ) {
      const folded = ts.isNumericLiteral(node)
        ? getNumber(node.text)
        : getLiteralValue(node)?.value;
      if (typeof folded === "string") literals.strings.add(folded);
      for (const value of typeof folded === "number" ? [folded, -folded] : []) {
        literals.numbers.set(getNumberKey(value), value);
      }
    } else if (ts.isBigIntLiteral(node)) {
      const digits = BigInt(node.text.slice(0, -1).replaceAll("_", ""));
      literals.bigints.add(digits.toString());
      literals.bigints.add((-digits).toString());
    } else if (ts.isObjectLiteralExpression(node)) {
      literals.objects.push(node);
      const object = getTemporal(node);
      const duration = object === undefined ? undefined : getDurationKey(object.value);
      if (duration !== undefined) literals.durations.set(duration, object?.value);
    } else if (ts.isArrayLiteralExpression(node)) {
      const list = getStringList(node);
      if (list !== undefined) literals.lists.push(list);
    }
    // A string is a list of its code points, as an iterable.
    if (
      (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      node.text.length <= 8
    ) {
      literals.lists.push([...node.text]);
    }
    if (ts.isNewExpression(node) || ts.isCallExpression(node)) {
      const name = getCalleeName(node);
      const values = (node.arguments ?? []).map((argument) => getLiteralValue(argument));
      const isDate = ts.isNewExpression(node) ? name === "Date" : name === "UTC";
      if (isDate && values.every((value) => value !== undefined && value.value !== undefined)) {
        const args = values.map((value) => value?.value) as [number];
        const time = attempt(() =>
          ts.isNewExpression(node) ? new Date(...args).getTime() : Date.UTC(...args),
        );
        if (time !== undefined) literals.times.add(time);
      }
      // localeCompare's locales follow the string it compares.
      const locales = node.arguments?.[name === "localeCompare" ? 1 : 0];
      const named = literals.locales.get(name) ?? [undefined];
      literals.locales.set(name, named);
      const temporal = getTemporal(node);
      const duration = temporal === undefined ? undefined : getDurationKey(temporal.value);
      if (duration !== undefined) literals.durations.set(duration, temporal?.value);
      const key = temporal === undefined ? undefined : getTemporalKey(temporal.value);
      if (key !== undefined && temporal !== undefined)
        literals.temporals.set(key, temporal.value as object);
      const literal = locales === undefined ? { value: undefined } : getLiteralValue(locales);
      const list = locales === undefined ? undefined : getStringList(locales);
      if (
        literal !== undefined &&
        (literal.value === undefined || typeof literal.value === "string")
      ) {
        named.push(literal.value as string | undefined);
      } else if (list !== undefined) named.push(list);
      else literals.openLocales.add(name);
    }
    ts.forEachChild(node, visit);
  };
  for (const sourceFile of sourceFiles) visit(sourceFile);
  // A subclass's calls name the locales of the service it extends.
  for (const [name, service] of subclasses) {
    literals.locales.set(service, [
      ...(literals.locales.get(service) ?? [undefined]),
      ...(literals.locales.get(name) ?? []),
    ]);
    if (literals.openLocales.has(name)) literals.openLocales.add(service);
  }
  return literals;
};

// The option bags that a service's constructor may read: none, and each that an object literal
// gives, with each property that isn't a literal taking each literal that its option takes.
const getBags = (service: Service, literals: Literals) => {
  const candidates = [...literals.strings, ...literals.numbers.values(), true, false];
  // The options that a property may name: its name, or for a name a program computes, each option
  // that a string of it names.
  const getNames = (name: ts.PropertyName | undefined) =>
    name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name))
      ? [name.text]
      : name !== undefined &&
          ts.isComputedPropertyName(name) &&
          getLiteralValue(name.expression) === undefined
        ? Object.keys(service.options).filter((option) => literals.strings.has(option))
        : [];
  const getObjectBags = (object: ts.ObjectLiteralExpression) =>
    object.properties.reduce<Record<string, unknown>[] | undefined>(
      (made, property) => {
        const names = getNames(property.name).filter((name) =>
          Object.hasOwn(service.options, name),
        );
        if (made === undefined || names.length === 0) return made;
        const literal = ts.isPropertyAssignment(property)
          ? getLiteralValue(property.initializer)
          : undefined;
        const next = made.flatMap((bag) =>
          names.flatMap((name) =>
            (literal === undefined
              ? candidates.filter(service.options[name])
              : [literal.value]
            ).map((value) => ({ ...bag, [name]: value })),
          ),
        );
        return next.length > MOST_BAGS_PER_LITERAL ? undefined : next;
      },
      [{}],
    ) ?? [];
  const bags = [{}, ...literals.objects.flatMap(getObjectBags)];
  return [...new Map(bags.map((bag) => [JSON.stringify(bag), bag])).values()];
};

const getLocaleCandidates = (service: Service, literals: Literals) => {
  const names = [service.name, ...service.callers];
  const named = names.flatMap((name) => literals.locales.get(name) ?? []);
  const open = names.some((name) => literals.openLocales.has(name))
    ? [...literals.strings].filter((text) => /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(text))
    : [];
  return [undefined, ...named, ...open];
};

const getCanonical = (locales: string | string[] | undefined) => {
  try {
    return locales === undefined ? [] : Intl.getCanonicalLocales(locales);
  } catch {
    return undefined;
  }
};

// A value as ESCore's key holds it: units, a TLA+ Boolean, an integer, or Empty.
const getTlaValue = (value: unknown): string =>
  value === undefined
    ? "Empty"
    : typeof value === "string"
      ? getUnitsOf(value)
      : typeof value === "boolean"
        ? value
          ? "TRUE"
          : "FALSE"
        : String(value);

// A value as ESCore holds it, or a record of the elements of an array of them, or undefined where
// it's neither.
const getEscoreValue = (value: unknown): string | undefined =>
  value === undefined
    ? "Undefined"
    : typeof value === "string"
      ? `Str(${getUnitsOf(value)})`
      : typeof value === "boolean"
        ? value
          ? "True"
          : "False"
        : typeof value === "number" && Number.isInteger(value) && Math.abs(value) < 2 ** 31
          ? `IntV(${value})`
          : Array.isArray(value)
            ? getElements(value)
            : undefined;

const getElements = (values: readonly unknown[]) => {
  const elements = values.map(getEscoreValue);
  return elements.some((element) => element === undefined)
    ? undefined
    : `[elements |-> <<${elements.join(", ")}>>]`;
};

// An answer of an array of values.
const getArray = (values: readonly unknown[]) => {
  const elements = getElements(values);
  return elements === undefined ? undefined : `[found |-> "array", ${elements.slice(1)}`;
};

const getNumberArgument = (value: number) =>
  `<<"number", ${getUnitsOf(String(value))}, ${Object.is(value, -0) ? "TRUE" : "FALSE"}>>`;

const getParts = (parts: readonly object[]) =>
  `[found |-> "parts", parts |-> <<${parts
    .map(
      (part) =>
        `<<${Object.entries(part)
          .map(([key, value]) => `<<${getUnitsOf(key)}, ${getUnitsOf(String(value))}>>`)
          .join(", ")}>>`,
    )
    .join(", ")}>>]`;

const getValue = (value: unknown) => {
  const escore = getEscoreValue(value);
  return escore === undefined ? undefined : `[found |-> "value", value |-> ${escore}]`;
};

// What the host answers to a call: its answer, or the error it throws.
const getAnswer = (answer: () => string | undefined) => {
  try {
    return answer();
  } catch (error) {
    return `[found |-> "error", error |-> "${error instanceof Error ? error.name : "Error"}"]`;
  }
};

const getNumbers = (literals: Literals) => [...literals.numbers.values()];

// TimeClip, whose -0 is +0, as a DateTimeFormat reads a time value.
const getTimeClip = (time: number) =>
  !Number.isFinite(time) || Math.abs(time) > 8.64e15 ? Number.NaN : Math.trunc(time) + 0;

// The resolved options of a NumberFormat but for its locale and its numbering system, in the order
// that resolvedOptions gives them, and of a PluralRules but for its locale and its categories.
const NUMBER_FORMAT_SLOTS = [
  "style",
  "currency",
  "currencyDisplay",
  "currencySign",
  "unit",
  "unitDisplay",
  "minimumIntegerDigits",
  "minimumFractionDigits",
  "maximumFractionDigits",
  "minimumSignificantDigits",
  "maximumSignificantDigits",
  "useGrouping",
  "notation",
  "compactDisplay",
  "signDisplay",
  "roundingIncrement",
  "roundingMode",
  "roundingPriority",
  "trailingZeroDisplay",
];
const PLURAL_RULES_SLOTS = [
  "type",
  "notation",
  "compactDisplay",
  "minimumIntegerDigits",
  "minimumFractionDigits",
  "maximumFractionDigits",
  "minimumSignificantDigits",
  "maximumSignificantDigits",
  "roundingIncrement",
  "roundingMode",
  "roundingPriority",
  "trailingZeroDisplay",
];

// A useGrouping of false is units in ESCore's key, which no string useGrouping is.
const getSlots = (slots: string[], resolved: Record<string, unknown>) =>
  `<<${slots.map((key) => getTlaValue(resolved[key] === false ? "false" : resolved[key])).join(", ")}>>`;

// The options of a service that IntlConstruct reads, each as ESCore holds what it read: a
// string's units, a Boolean, or Empty, or as the service encodes it, or undefined where ESCore
// can't hold it.
const getRead = (service: Service, bag: Record<string, unknown>) => {
  const values = Object.entries(service.options).map(([key, isAllowed]) => {
    const encode = service.encoders?.[key];
    return bag[key] === undefined
      ? "Empty"
      : encode !== undefined
        ? encode(bag[key])
        : isAllowed === isBoolean
          ? getTlaValue(Boolean(bag[key]))
          : getTlaValue(String(bag[key]));
  });
  return values.some((value) => value === undefined) ? undefined : `<<${values.join(", ")}>>`;
};

const SERVICES: Service[] = [
  {
    name: "NumberFormat",
    options: {
      ...MATCHER,
      numberingSystem: isTypeSequence,
      style: isOneOf("decimal", "percent", "currency", "unit"),
      currency: (value) => typeof value === "string" && /^[A-Za-z]{3}$/.test(value),
      currencyDisplay: isOneOf("code", "symbol", "narrowSymbol", "name"),
      currencySign: isOneOf("standard", "accounting"),
      unit: (value) => typeof value === "string" && /^[a-z]+(?:-[a-z]+)*$/.test(value),
      unitDisplay: isOneOf("short", "narrow", "long"),
      notation: isOneOf("standard", "scientific", "engineering", "compact"),
      ...DIGITS,
      compactDisplay: isOneOf("short", "long"),
      useGrouping: (value) =>
        typeof value === "boolean" || isOneOf("min2", "auto", "always", "true", "false")(value),
      signDisplay: isOneOf("auto", "never", "always", "exceptZero", "negative"),
    },
    getConfig: (bag, resolved) =>
      `${getTlaValue(String(bag.localeMatcher ?? "best fit"))}, ${getTlaValue(bag.numberingSystem === undefined ? undefined : String(bag.numberingSystem))}, ${getSlots(
        NUMBER_FORMAT_SLOTS,
        {
          ...resolved,
          // resolvedOptions gives "standard" where signDisplay is "never", but the slot keeps it.
          currencySign:
            resolved.style === "currency" ? String(bag.currencySign ?? "standard") : undefined,
        },
      )}`,
    getMethods: (format: Intl.NumberFormat, literals, words) => {
      const values = [
        ...getNumbers(literals).map((value) => ({ value, key: getNumberArgument(value) })),
        ...[...literals.bigints].map((value) => ({
          value: BigInt(value),
          key: `<<"bigint", ${getUnitsOf(value)}>>`,
        })),
        ...[...literals.strings]
          .filter((text) => text.length <= 40 && /\d|Infinity/.test(text))
          .map((value) => ({ value, key: `<<"string", ${getUnitsOf(value)}>>` })),
      ];
      const methods = new Map<string, string | undefined>();
      if (["format", "formatToParts", "toLocaleString"].some((word) => words.has(word))) {
        for (const value of values) {
          methods.set(
            `"formatToParts", <<${value.key}>>`,
            getParts(format.formatToParts(value.value as number)),
          );
        }
      }
      if (words.has("formatRange") || words.has("formatRangeToParts")) {
        for (const start of values) {
          for (const end of values) {
            methods.set(
              `"formatRangeToParts", <<${start.key}, ${end.key}>>`,
              getAnswer(() =>
                getParts(format.formatRangeToParts(start.value as number, end.value as number)),
              ),
            );
          }
        }
      }
      return methods as Map<string, string>;
    },
    callers: ["toLocaleString"],
  },
  {
    name: "PluralRules",
    options: {
      ...MATCHER,
      type: isOneOf("cardinal", "ordinal"),
      notation: isOneOf("standard", "scientific", "engineering", "compact"),
      compactDisplay: isOneOf("short", "long"),
      ...DIGITS,
    },
    getConfig: (bag, resolved) =>
      `${getTlaValue(String(bag.localeMatcher ?? "best fit"))}, ${getSlots(PLURAL_RULES_SLOTS, resolved)}`,
    getMethods: (rules: Intl.PluralRules, literals, words) => {
      const methods = new Map<string, string | undefined>();
      const numbers = getNumbers(literals);
      if (words.has("select")) {
        for (const value of numbers) {
          methods.set(`"select", <<${getNumberArgument(value)}>>`, getValue(rules.select(value)));
        }
      }
      if (words.has("selectRange")) {
        for (const start of numbers) {
          for (const end of numbers) {
            methods.set(
              `"selectRange", <<${getNumberArgument(start)}, ${getNumberArgument(end)}>>`,
              getAnswer(() =>
                getValue(Reflect.apply(Reflect.get(rules, "selectRange"), rules, [start, end])),
              ),
            );
          }
        }
      }
      return methods as Map<string, string>;
    },
    callers: [],
  },
  {
    name: "Collator",
    options: {
      usage: isOneOf("sort", "search"),
      ...MATCHER,
      collation: isTypeSequence,
      numeric: isBoolean,
      caseFirst: isOneOf("upper", "lower", "false"),
      sensitivity: isOneOf("base", "accent", "case", "variant"),
      ignorePunctuation: isBoolean,
    },
    getConfig: () => "",
    getMethods: (collator: Intl.Collator, literals, words) => {
      const methods = new Map<string, string | undefined>();
      if (words.has("compare") || words.has("localeCompare")) {
        const strings = [...literals.arguments].filter((text) => text.length <= 40);
        for (const left of strings) {
          for (const right of strings) {
            methods.set(
              `"compare", <<${getUnitsOf(left)}, ${getUnitsOf(right)}>>`,
              getValue(collator.compare(left, right)),
            );
          }
        }
      }
      return methods as Map<string, string>;
    },
    callers: ["localeCompare"],
  },
  {
    name: "ListFormat",
    options: {
      ...MATCHER,
      type: isOneOf("conjunction", "disjunction", "unit"),
      style: isOneOf("long", "short", "narrow"),
    },
    getConfig: () => "",
    getMethods: (format: Intl.ListFormat, literals, words) => {
      const methods = new Map<string, string | undefined>();
      if (words.has("format") || words.has("formatToParts")) {
        for (const list of literals.lists) {
          methods.set(
            `"formatToParts", <<<<${list.map(getUnitsOf).join(", ")}>>>>`,
            getParts(format.formatToParts(list)),
          );
        }
      }
      return methods as Map<string, string>;
    },
    callers: [],
  },
  {
    name: "RelativeTimeFormat",
    options: {
      ...MATCHER,
      numberingSystem: isTypeSequence,
      style: isOneOf("long", "short", "narrow"),
      numeric: isOneOf("always", "auto"),
    },
    getConfig: () => "",
    getMethods: (format: Intl.RelativeTimeFormat, literals, words) => {
      const methods = new Map<string, string | undefined>();
      if (words.has("format") || words.has("formatToParts")) {
        const units = [...literals.strings].filter((text) => /^[a-z]{3,12}$/.test(text));
        for (const value of getNumbers(literals)) {
          for (const unit of units) {
            methods.set(
              `"formatToParts", <<${getNumberArgument(value)}, ${getUnitsOf(unit)}>>`,
              getAnswer(() =>
                getParts(format.formatToParts(value, unit as Intl.RelativeTimeFormatUnit)),
              ),
            );
          }
        }
      }
      return methods as Map<string, string>;
    },
    callers: [],
  },
  {
    name: "DisplayNames",
    options: {
      ...MATCHER,
      style: isOneOf("narrow", "short", "long"),
      type: isOneOf("language", "region", "script", "currency", "calendar", "dateTimeField"),
      fallback: isOneOf("code", "none"),
      languageDisplay: isOneOf("dialect", "standard"),
    },
    getConfig: () => "",
    getMethods: (names: Intl.DisplayNames, literals, words) => {
      const methods = new Map<string, string | undefined>();
      if (words.has("of")) {
        for (const code of [...literals.strings].filter((text) => text.length <= 40)) {
          methods.set(
            `"of", <<${getUnitsOf(code)}>>`,
            getAnswer(() => getValue(names.of(code))),
          );
        }
      }
      return methods as Map<string, string>;
    },
    callers: [],
  },
  {
    name: "DateTimeFormat",
    options: {
      ...MATCHER,
      calendar: isTypeSequence,
      numberingSystem: isTypeSequence,
      hour12: isBoolean,
      hourCycle: isOneOf("h11", "h12", "h23", "h24"),
      timeZone: (value) =>
        typeof value === "string" &&
        /^(?:[A-Za-z_-]+\/[A-Za-z0-9_+/-]+|utc|gmt|[+-]\d\d(?::?\d\d)?)$/i.test(value),
      weekday: isOneOf("narrow", "short", "long"),
      era: isOneOf("narrow", "short", "long"),
      year: isOneOf("2-digit", "numeric"),
      month: isOneOf("2-digit", "numeric", "narrow", "short", "long"),
      day: isOneOf("2-digit", "numeric"),
      dayPeriod: isOneOf("narrow", "short", "long"),
      hour: isOneOf("2-digit", "numeric"),
      minute: isOneOf("2-digit", "numeric"),
      second: isOneOf("2-digit", "numeric"),
      fractionalSecondDigits: isInteger,
      timeZoneName: isOneOf(
        "short",
        "long",
        "shortOffset",
        "longOffset",
        "shortGeneric",
        "longGeneric",
      ),
      formatMatcher: isOneOf("basic", "best fit"),
      dateStyle: isOneOf("full", "long", "medium", "short"),
      timeStyle: isOneOf("full", "long", "medium", "short"),
    },
    encoders: {
      // A time zone's identifier as Temporal gives it, which ESCore's time zones hold.
      timeZone: (value) => {
        if (String(value).toUpperCase() === "UTC") return getUnitsOf("UTC");
        const temporal: unknown = Reflect.get(globalThis, "Temporal");
        if (typeof temporal !== "object" || temporal === null) return undefined;
        try {
          const zoned: object = Reflect.construct(Reflect.get(temporal, "ZonedDateTime"), [
            0n,
            String(value),
          ]);
          return getUnitsOf(String(Reflect.get(zoned, "timeZoneId")));
        } catch {
          return undefined;
        }
      },
      fractionalSecondDigits: (value) => String(Math.floor(Number(value))),
    },
    getConfig: () => "",
    getMethods: (format: Intl.DateTimeFormat, literals, words) => {
      const methods = new Map<string, string | undefined>();
      // ESCore's local time zone is UTC, which the host's must be for a format without one.
      if (new Intl.DateTimeFormat().resolvedOptions().timeZone !== "UTC") return new Map();
      const values = [
        ...[...new Set([...getNumbers(literals), ...literals.times].map(getTimeClip))]
          .filter((time) => !Number.isNaN(time))
          .map((time) => ({ key: getNumberArgument(time), value: time as unknown })),
        ...[...literals.temporals].map(([key, value]) => ({ key, value: value as unknown })),
      ];
      if (words.has("format") || words.has("formatToParts")) {
        for (const value of values) {
          methods.set(
            `"formatToParts", <<${value.key}>>`,
            getAnswer(() => getParts(format.formatToParts(value.value as number))),
          );
        }
      }
      if (words.has("formatRange") || words.has("formatRangeToParts")) {
        for (const start of values) {
          for (const end of values) {
            methods.set(
              `"formatRangeToParts", <<${start.key}, ${end.key}>>`,
              getAnswer(() =>
                getParts(format.formatRangeToParts(start.value as number, end.value as number)),
              ),
            );
          }
        }
      }
      return methods as Map<string, string>;
    },
    callers: [],
  },
  {
    name: "DurationFormat",
    options: {
      ...MATCHER,
      numberingSystem: isTypeSequence,
      style: isOneOf("long", "short", "narrow", "digital"),
      ...Object.fromEntries(
        DURATION_FIELDS.flatMap((field) => [
          [field, isOneOf("long", "short", "narrow", "numeric", "2-digit")],
          [`${field}Display`, isOneOf("auto", "always")],
        ]),
      ),
      fractionalDigits: isInteger,
    },
    getConfig: (bag) =>
      `${getTlaValue(String(bag.localeMatcher ?? "best fit"))}, ${getTlaValue(bag.numberingSystem === undefined ? undefined : String(bag.numberingSystem))}, ${getTlaValue(String(bag.style ?? "short"))}, <<${DURATION_FIELDS.flatMap(
        (field) =>
          [field, `${field}Display`].map((key) =>
            getTlaValue(bag[key] === undefined ? undefined : String(bag[key])),
          ),
      ).join(
        ", ",
      )}>>, ${bag.fractionalDigits === undefined ? "Empty" : String(Math.floor(Number(bag.fractionalDigits)))}`,
    getMethods: (format: object, literals, words) => {
      const methods = new Map<string, string | undefined>([
        [`"construct", <<>>`, `[found |-> "value", value |-> True]`],
      ]);
      if (["format", "formatToParts", "toLocaleString"].some((word) => words.has(word))) {
        for (const [key, value] of literals.durations) {
          methods.set(
            `"formatToParts", <<${key}>>`,
            getAnswer(() =>
              getParts(
                Reflect.apply(Reflect.get(format, "formatToParts"), format, [value]) as object[],
              ),
            ),
          );
        }
      }
      return methods as Map<string, string>;
    },
    callers: ["toLocaleString"],
  },
  {
    name: "Segmenter",
    options: { ...MATCHER, granularity: isOneOf("grapheme", "word", "sentence") },
    getConfig: () => "",
    getMethods: (segmenter: Intl.Segmenter, literals, words) => {
      const methods = new Map<string, string>();
      if (!words.has("segment")) return methods;
      for (const text of [...literals.strings].filter((string) => string.length <= 200)) {
        const segments = [...segmenter.segment(text)];
        const isWord = segmenter.resolvedOptions().granularity === "word";
        methods.set(
          `"segment", <<${getUnitsOf(text)}>>`,
          `[found |-> "segments", starts |-> <<${segments.map((segment) => segment.index).join(", ")}>>, words |-> <<${isWord ? segments.map((segment) => (segment.isWordLike === true ? "TRUE" : "FALSE")).join(", ") : ""}>>]`,
        );
      }
      return methods;
    },
    callers: [],
  },
];

// The options of Intl.Locale, any of whose strings the host may reject.
const isStringLike: Validator = (value) => typeof value === "string" || isInteger(value);
// The options of a Temporal object's toLocaleString after its locale matcher, its calendar and
// numbering system, its hour cycle, and its time zone, in the order it reads them.
const TEMPORAL_FORMAT_OPTIONS = [
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
  "formatMatcher",
  "dateStyle",
  "timeStyle",
];

// The entries of the toLocaleString of the Temporal objects that the program's literals make, for
// each of its locales and option bags, keyed as ESCore's TemporalToLocaleString keys them.
const getTemporalEntries = (literals: Literals) => {
  const entries = new Map<string, string>();
  const service = SERVICES.find((candidate) => candidate.name === "DateTimeFormat");
  if (service === undefined) return entries;
  const bags = getBags(service, literals);
  const locales = getLocaleCandidates(
    { ...service, name: "toLocaleString", callers: [] },
    literals,
  );
  for (const [key, value] of literals.temporals) {
    for (const locale of locales) {
      const requested = getCanonical(locale);
      if (requested === undefined) continue;
      for (const bag of bags) {
        const read = [
          ...["localeMatcher", "calendar", "numberingSystem"].map((option) =>
            bag[option] === undefined ? "Empty" : getTlaValue(String(bag[option])),
          ),
          bag.hour12 === undefined ? "Empty" : getTlaValue(Boolean(bag.hour12)),
          bag.hourCycle === undefined ? "Empty" : getTlaValue(String(bag.hourCycle)),
          bag.timeZone === undefined ? "Empty" : getTlaValue(String(bag.timeZone)),
          ...TEMPORAL_FORMAT_OPTIONS.map((option) =>
            bag[option] === undefined
              ? "Empty"
              : option === "fractionalSecondDigits"
                ? String(Math.floor(Number(bag[option])))
                : getTlaValue(String(bag[option])),
          ),
        ];
        const answer = getAnswer(() =>
          getValue(Reflect.apply(Reflect.get(value, "toLocaleString"), value, [locale, bag])),
        );
        if (answer !== undefined && entries.size <= MOST_ENTRIES) {
          entries.set(
            `<<"Temporal", <<<<${requested.map(getUnitsOf).join(", ")}>>, <<${read.join(", ")}>>>>, "toLocaleString", <<${key}>>>>`,
            answer,
          );
        }
      }
    }
  }
  return entries;
};

// The entries of Date's toLocaleString, toLocaleDateString, and toLocaleTimeString of the time
// values that the program's literals make, for each of its locales and option bags, keyed as
// ESCore's DateToLocaleString keys them, where the host's time zone is ESCore's, UTC.
const DATE_METHODS = ["toLocaleString", "toLocaleDateString", "toLocaleTimeString"];
const getDateEntries = (literals: Literals, words: ReadonlySet<string>) => {
  const entries = new Map<string, string>();
  const service = SERVICES.find((candidate) => candidate.name === "DateTimeFormat");
  const methods = DATE_METHODS.filter((method) => words.has(method));
  if (
    service === undefined ||
    methods.length === 0 ||
    !words.has("Date") ||
    new Intl.DateTimeFormat().resolvedOptions().timeZone !== "UTC"
  ) {
    return entries;
  }
  const times = [...new Set([...getNumbers(literals), ...literals.times].map(getTimeClip))].filter(
    (time) => !Number.isNaN(time),
  );
  const bags = getBags(service, literals);
  for (const method of methods) {
    for (const locales of getLocaleCandidates(
      { ...service, name: method, callers: [] },
      literals,
    )) {
      const requested = getCanonical(locales);
      if (requested === undefined) continue;
      for (const bag of bags) {
        const read = getRead(service, bag);
        if (read === undefined) continue;
        for (const time of times) {
          const answer = getAnswer(() =>
            getValue(
              Reflect.apply(Reflect.get(Date.prototype, method), new Date(time), [locales, bag]),
            ),
          );
          if (answer !== undefined && entries.size <= MOST_ENTRIES) {
            entries.set(
              `<<"Date", <<<<${requested.map(getUnitsOf).join(", ")}>>, ${read}>>, "${method}", <<${getNumberArgument(time)}>>>>`,
              answer,
            );
          }
        }
      }
    }
  }
  return entries;
};

const LOCALE_OPTIONS: Record<string, Validator> = {
  language: isStringLike,
  script: isStringLike,
  region: isStringLike,
  calendar: isStringLike,
  collation: isStringLike,
  firstDayOfWeek: isStringLike,
  hourCycle: isOneOf("h11", "h12", "h23", "h24"),
  caseFirst: isOneOf("upper", "lower", "false"),
  numeric: isBoolean,
  numberingSystem: isStringLike,
};
const LOCALE_GETTERS = [
  "baseName",
  "calendar",
  "caseFirst",
  "collation",
  "firstDayOfWeek",
  "hourCycle",
  "language",
  "numberingSystem",
  "numeric",
  "region",
  "script",
];
const LOCALE_INFO = [
  "getCalendars",
  "getCollations",
  "getHourCycles",
  "getNumberingSystems",
  "getTextInfo",
  "getTimeZones",
  "getWeekInfo",
];
// The tags of the locales that maximize and minimize make, as far as this many steps.
const LOCALE_STEPS = 3;

// The entries of the Intl.Locale objects that the program's literals make, keyed by the tag and
// the options that ESCore's LocaleConstruct reads, and of the locales that their maximize and
// minimize make: each one's tag or the error that its constructor throws, and what each accessor
// and method gives.
const getLocaleEntries = (literals: Literals) => {
  const entries = new Map<string, string>();
  const service = { name: "Locale", options: LOCALE_OPTIONS, callers: [] } as unknown as Service;
  const bags = getBags(service, literals);
  const getConfig = (tag: string, bag: Record<string, unknown>) =>
    `<<${getUnitsOf(tag)}, <<${Object.keys(LOCALE_OPTIONS)
      .map((key) =>
        bag[key] === undefined
          ? "Empty"
          : key === "numeric"
            ? getTlaValue(Boolean(bag[key]))
            : getTlaValue(String(bag[key])),
      )
      .join(", ")}>>>>`;
  const record = (tag: string, bag: Record<string, unknown>) => {
    const config = getConfig(tag, bag);
    if (entries.has(`<<"Locale", ${config}, "construct", <<>>>>`) || entries.size > MOST_ENTRIES) {
      return [];
    }
    const locale = (() => {
      try {
        return new Intl.Locale(tag, bag);
      } catch (error) {
        entries.set(
          `<<"Locale", ${config}, "construct", <<>>>>`,
          `[found |-> "error", error |-> "${error instanceof Error ? error.name : "Error"}"]`,
        );
        return undefined;
      }
    })();
    if (locale === undefined) return [];
    entries.set(
      `<<"Locale", ${config}, "construct", <<>>>>`,
      `[found |-> "value", value |-> Str(${getUnitsOf(locale.toString())})]`,
    );
    for (const getter of LOCALE_GETTERS) {
      const answer = getValue(Reflect.get(locale, getter));
      if (answer !== undefined) entries.set(`<<"Locale", ${config}, "${getter}", <<>>>>`, answer);
    }
    for (const method of LOCALE_INFO) {
      const answer = getAnswer(() => {
        const value: unknown = Reflect.apply(Reflect.get(locale, method), locale, []);
        if (Array.isArray(value)) return getArray(value);
        if (typeof value === "object" && value !== null) {
          const pairs = Object.entries(value).map(([key, inner]) => [key, getEscoreValue(inner)]);
          return pairs.some((pair) => pair[1] === undefined)
            ? undefined
            : `[found |-> "options", pairs |-> <<${pairs.map(([key, inner]) => `<<${getUnitsOf(String(key))}, ${inner}>>`).join(", ")}>>]`;
        }
        return getValue(value);
      });
      if (answer !== undefined) entries.set(`<<"Locale", ${config}, "${method}", <<>>>>`, answer);
    }
    return ["maximize", "minimize"].map((method) => {
      const made = String(Reflect.apply(Reflect.get(locale, method), locale, []));
      entries.set(
        `<<"Locale", ${config}, "${method}", <<>>>>`,
        `[found |-> "value", value |-> Str(${getUnitsOf(made)})]`,
      );
      return made;
    });
  };
  const tags = getLocaleCandidates(service, literals).filter(
    (tag): tag is string => typeof tag === "string",
  );
  const step = (made: readonly string[], left: number): void => {
    const next = [...new Set(made)].flatMap((tag) => bags.flatMap((bag) => record(tag, bag)));
    if (left > 1 && next.length > 0) step(next, left - 1);
  };
  step(tags, LOCALE_STEPS);
  return entries;
};

// The services whose constructor ESCore's NumberFormatConstruct or PluralRulesConstruct runs, which
// key an object by its resolved options; IntlConstruct's key it by the options it read.
const RESOLVING = new Set(["NumberFormat", "PluralRules", "DurationFormat"]);

// The program's HostIntl, and the strings of its answers: what the host's Intl gives for the currencies and the Intl objects that
// the program's literals make, keyed as ESCore keys them, and for each argument its literals may be
// of the methods it names. Any other key stops, which the host may hold data of.
export const getHostIntl = (sourceFiles: readonly ts.SourceFile[], words: ReadonlySet<string>) => {
  const entries = new Map<string, string>();
  const services = SERVICES.filter((service) =>
    [service.name, ...service.callers].some((word) => words.has(word)),
  );
  const isNamed = [
    "Locale",
    "toLocaleLowerCase",
    "toLocaleUpperCase",
    "toLocaleDateString",
    "toLocaleTimeString",
  ].some((word) => words.has(word));
  const literals = getLiterals(services.length === 0 && !isNamed ? [] : sourceFiles);
  for (const service of services) {
    if (service.name === "NumberFormat") {
      for (const text of literals.strings) {
        if (!/^[A-Za-z]{3}$/.test(text)) continue;
        const digits = new Intl.NumberFormat("en", {
          style: "currency",
          currency: text,
        }).resolvedOptions().maximumFractionDigits;
        entries.set(
          `<<"currencyDigits", ${getUnitsOf(text.toUpperCase())}>>`,
          `[found |-> "digits", digits |-> ${digits}]`,
        );
      }
    }
    const configs = new Map<string, object>();
    const Constructor = Reflect.get(Intl, service.name) as new (
      locales: unknown,
      options: unknown,
    ) => { resolvedOptions: () => Record<string, unknown> };
    for (const locales of getLocaleCandidates(service, literals)) {
      const requested = getCanonical(locales);
      if (requested === undefined) continue;
      for (const bag of getBags(service, literals)) {
        const object = (() => {
          try {
            return new Constructor(locales, bag);
          } catch (error) {
            // A DurationFormat whose options ESCore accepts constructs as HostIntl answers.
            if (service.name === "DurationFormat") {
              entries.set(
                `<<"${service.name}", <<<<${requested.map(getUnitsOf).join(", ")}>>, ${service.getConfig(bag, {})}>>, "construct", <<>>>>`,
                `[found |-> "error", error |-> "${error instanceof Error ? error.name : "Error"}"]`,
              );
            }
            return undefined;
          }
        })();
        if (object === undefined) continue;
        const resolved = { ...object.resolvedOptions() };
        const pairs = Object.entries(resolved).map(([key, value]) => [key, getEscoreValue(value)]);
        if (pairs.some((pair) => pair[1] === undefined)) continue;
        const read = RESOLVING.has(service.name)
          ? service.getConfig(bag, resolved)
          : getRead(service, bag);
        if (read === undefined) continue;
        const config = `<<<<${requested.map(getUnitsOf).join(", ")}>>, ${read}>>`;
        if (configs.has(config)) continue;
        configs.set(config, object);
        entries.set(
          `<<"${service.name}", ${config}, "resolvedOptions", <<>>>>`,
          `[found |-> "options", pairs |-> <<${pairs.map(([key, value]) => `<<${getUnitsOf(String(key))}, ${value}>>`).join(", ")}>>]`,
        );
      }
    }
    const methods = [...configs].map(([config, object]) => ({
      config,
      answers: service.getMethods(object as never, literals, words),
    }));
    if (
      entries.size + methods.reduce((total, method) => total + method.answers.size, 0) >
      MOST_ENTRIES
    ) {
      continue;
    }
    for (const method of methods) {
      for (const [key, answer] of method.answers) {
        if (answer !== undefined) {
          entries.set(`<<"${service.name}", ${method.config}, ${key}>>`, answer);
        }
      }
    }
  }
  if (words.has("Locale")) {
    for (const [key, answer] of getLocaleEntries(literals)) entries.set(key, answer);
  }
  for (const method of ["toLocaleLowerCase", "toLocaleUpperCase"]) {
    if (!words.has(method)) continue;
    const named = getLocaleCandidates(
      { name: method, callers: [] } as unknown as Service,
      literals,
    );
    for (const locales of named) {
      const requested = getCanonical(locales);
      if (requested === undefined || requested.length === 0) continue;
      for (const text of [...literals.strings].filter((string) => string.length <= 200)) {
        const answer = getValue(
          Reflect.apply(Reflect.get(String.prototype, method), text, [locales]),
        );
        if (answer !== undefined && entries.size <= MOST_ENTRIES) {
          entries.set(
            `<<"String", <<<<${requested.map(getUnitsOf).join(", ")}>>>>, "${method}", <<${getUnitsOf(text)}>>>>`,
            answer,
          );
        }
      }
    }
  }
  for (const [key, answer] of getDateEntries(literals, words)) entries.set(key, answer);
  if (words.has("supportedValuesOf")) {
    for (const key of [
      "calendar",
      "collation",
      "currency",
      "numberingSystem",
      "timeZone",
      "unit",
    ]) {
      const answer = getArray(Reflect.apply(Intl.supportedValuesOf, Intl, [key]) as unknown[]);
      if (answer !== undefined) {
        entries.set(`<<"Intl", <<>>, "supportedValuesOf", <<${getUnitsOf(key)}>>>>`, answer);
      }
    }
  }
  if (words.has("toLocaleString") && literals.temporals.size > 0) {
    for (const [key, answer] of getTemporalEntries(literals)) entries.set(key, answer);
  }
  // Tables of a few entries each, as a check evaluates an expression of fewer parts.
  const tables = Array.from({ length: Math.ceil(entries.size / TABLE_SIZE) }, (_, index) => ({
    name: `IntlTable${index + 1}`,
    entries: [...entries].slice(index * TABLE_SIZE, (index + 1) * TABLE_SIZE),
  }));
  // The strings of the host's answers, which a program may pass back as locales.
  const strings = new Set(
    [...entries.values()].flatMap((answer) =>
      [...answer.matchAll(/Str\(<<([\d, ]*)>>\)/g)].map((match) =>
        String.fromCharCode(...(match[1].match(/\d+/g) ?? []).map(Number)),
      ),
    ),
  );
  const definitions = [
    ...tables.map((table) => ({
      name: table.name,
      arity: 0,
      text: `${table.name} ==\n  ${table.entries.map(([key, value]) => `(${key} :> ${value})`).join("\n  @@ ")}`,
    })),
    {
      name: "HostIntl",
      arity: 1,
      text:
        tables.length === 0
          ? `HostIntl(key) == [found |-> "unknown"]`
          : `HostIntl(key) ==\n  CASE ${[...tables.map((table) => `key \\in DOMAIN ${table.name} -> ${table.name}[key]`), `OTHER -> [found |-> "unknown"]`].join("\n    [] ")}`,
    },
  ];
  return { definitions, strings };
};
