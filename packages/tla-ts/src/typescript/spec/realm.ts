import type { Library } from "./library";
import { getNumber } from "./specialize";

// What the host's Intl gives of a locale tag: its canonical form and the services that support it
// with each locale matcher, and those whose matchers differ.
export interface HostLocale {
  canonical: string;
  lookup: string[];
  bestFit: string[];
  differs: string[];
}

// What a compiled spec reads of the host whose behavior it models, so that the spec is the same
// wherever it compiles. Node records it live (recordHostRealm). A browser reads it as Node recorded
// it, as plain data, without the functions, so that a program that asks the host about a locale
// tag or a time zone that it writes stops where Node would answer.
export interface HostRealm {
  // The globals of a script's context, a new context of the host's virtual machine, that ESCore's
  // realm lacks, at whose names a compile stops.
  scriptGlobals: string[];
  // The globals of the host's own context, where a module runs, that ESCore's realm lacks, each
  // with the record that DefineHost defines it by, where it defines one.
  moduleGlobals: { name: string; record: string | undefined }[];
  // The properties of the host's built-ins whose keys ESCore's realm has nowhere, such as V8's
  // Error.captureStackTrace, by the intrinsic that holds each, with the record that DefineHost
  // defines it by, where it defines one.
  builtInProperties: { owner: string; key: string; record: string | undefined }[];
  // The realm's properties that the host lacks, such as proposals engine262 has and Node doesn't.
  missingProperties: { owner: string; key: string }[];
  // The order of the own keys of each of the realm's built-ins that the host has, as the host gives
  // them: its strings, and the well-known symbols by the number that ESCore gives each.
  keyOrders: { owner: string; keys: (string | number)[] }[];
  // The host's default locale and time zone, and the name of the zone that V8 writes after a
  // date's offset in the locale.
  locale: string;
  timeZone: string;
  zoneName: string;
  // The time value that the host's Date.parse gives a string.
  parseDate?: (text: string) => number;
  // Whether the host has no time zone of a name.
  isRejectedZone?: (name: string) => boolean;
  // What the host's Intl gives of a tag, or undefined where it isn't a structurally valid tag.
  getLocale?: (tag: string) => HostLocale | undefined;
  // What it gives of the tags of RECORDED_LOCALE_TAGS, which a realm without getLocale answers.
  recordedLocales: { tag: string; locale?: HostLocale }[];
}

// The locale tags whose answers a realm records for a browser, which answers no other: en-US, the
// default of the Node that records them, and the locales that programs commonly name. The
// playground's examples name none.
export const RECORDED_LOCALE_TAGS = [
  "en-US",
  "en",
  "en-GB",
  "ar",
  "de",
  "de-DE",
  "es",
  "es-ES",
  "fr",
  "fr-FR",
  "hi",
  "it",
  "ja",
  "ja-JP",
  "ko",
  "nl",
  "pt",
  "pt-BR",
  "ru",
  "sv",
  "tr",
  "zh",
  "zh-CN",
  "zh-TW",
];

// The host's timers, which a host adds to a script's context to run its jobs later.
const HOST_TIMERS = ["setInterval", "setImmediate", "queueMicrotask"];

// The host's constructors that make an object quietly, running nothing that a program sees but
// what QuietConstruct converts of their arguments until it uses the object.
const QUIET_CONSTRUCTORS = new Set(["TextEncoder", "TextDecoder"]);

// The services of Intl whose supportedLocalesOf HostLocale answers for.
const LOCALE_SERVICES = [
  "Collator",
  "DateTimeFormat",
  "DisplayNames",
  "DurationFormat",
  "ListFormat",
  "NumberFormat",
  "PluralRules",
  "RelativeTimeFormat",
  "Segmenter",
];

const getBoolean = (value: boolean) => (value ? "TRUE" : "FALSE");

// Whether a value of the host is a constructor, which Reflect.construct tells by throwing where
// it isn't one, without running it.
const isConstructor = (value: unknown) => {
  if (typeof value !== "function") return false;
  try {
    Reflect.construct(String, [], value);
    return true;
  } catch {
    return false;
  }
};

// A property of the host's global object or of one of its built-ins, as the record that DefineHost
// defines it by: its kind, as typeof gives its value, or value for a primitive, or console, which
// the runtime has part of, or accessor for a built-in's accessor, and its attributes. A global's
// getter gives its value, and a property whose value is a symbol or a BigInt is left out.
const getHostProperty = (
  owner: string,
  name: string,
  descriptor: PropertyDescriptor | undefined,
  host: object | undefined,
) => {
  if (descriptor === undefined) return undefined;
  const isAccessor = !("value" in descriptor);
  const value: unknown = !isAccessor
    ? descriptor.value
    : host === undefined
      ? undefined
      : Reflect.get(host, name);
  const primitive =
    value === undefined
      ? "Undefined"
      : value === null
        ? "Null"
        : typeof value === "boolean"
          ? value
            ? "True"
            : "False"
          : typeof value === "number"
            ? `Num(${getNumber(value)})`
            : typeof value === "string"
              ? `Str(N(${JSON.stringify(value)}))`
              : undefined;
  const kind =
    (name === "console" || name === "process") && host !== undefined
      ? name
      : isAccessor && host === undefined
        ? "accessor"
        : typeof value === "function" || (typeof value === "object" && value !== null)
          ? typeof value
          : value === undefined && isAccessor
            ? "undefined"
            : primitive !== undefined
              ? "value"
              : undefined;
  return kind === undefined
    ? undefined
    : `[owner |-> "${owner}", name |-> N("${name}"), kind |-> "${kind}", value |-> ${primitive ?? "Undefined"}, isConstructor |-> ${getBoolean(isConstructor(value))}, isQuiet |-> ${getBoolean(owner === "GlobalObject" && QUIET_CONSTRUCTORS.has(name))}, isAccessor |-> ${getBoolean(isAccessor)}, writable |-> ${getBoolean(descriptor.writable === true)}, enumerable |-> ${getBoolean(descriptor.enumerable === true)}, configurable |-> ${getBoolean(descriptor.configurable === true)}]`;
};

// The realm of the host that runs this process, for ESCore's library: Node's, whose script runs in
// a new context of its virtual machine, the reference a program runs on, whose global object has
// ECMAScript's globals and the host's own, such as Intl and console, and not Node's module globals,
// such as process and global, which a module's context has.
export const recordHostRealm = (library: Library): HostRealm => {
  const scriptGlobal: object = process.getBuiltinModule("node:vm").runInNewContext("globalThis");
  // The object an intrinsic of ESCore's names in the host, if it has one.
  const getHostObject = (owner: string): object | undefined => {
    if (owner === "GlobalObject") return scriptGlobal;
    const isPrototype = owner.endsWith("Prototype");
    const base = isPrototype ? owner.slice(0, -"Prototype".length) : owner;
    // An intrinsic of a namespace, such as TemporalPlainDate or IntlCollator, is the namespace's.
    const namespace = ["Temporal", "Intl"].find((name) => base.startsWith(name) && base !== name);
    const holder: unknown =
      namespace === undefined ? scriptGlobal : Reflect.get(scriptGlobal, namespace);
    const found: unknown =
      base === "TypedArray"
        ? Object.getPrototypeOf(Reflect.get(scriptGlobal, "Int8Array"))
        : typeof holder === "object" && holder !== null
          ? Reflect.get(holder, namespace === undefined ? base : base.slice(namespace.length))
          : undefined;
    if ((typeof found !== "object" && typeof found !== "function") || found === null)
      return undefined;
    const object: unknown = isPrototype ? Reflect.get(found, "prototype") : found;
    return (typeof object === "object" || typeof object === "function") && object !== null
      ? object
      : undefined;
  };
  const realmGlobals = new Set([
    ...library.properties
      .filter((property) => property.owner === "GlobalObject")
      .map((property) => property.key),
    "setTimeout",
    // The parameters of the function that Node wraps a CommonJS module's code in, which the process
    // that compiles may hold as globals.
    "exports",
    "require",
    "module",
    "__filename",
    "__dirname",
  ]);
  const getHostOnlyGlobals = (host: object) =>
    [...Object.getOwnPropertyNames(host), ...HOST_TIMERS].filter((name) => !realmGlobals.has(name));
  const known = new Set(
    [...library.definitions.values()].flatMap((definition) =>
      [...definition.text.matchAll(/\bSV\("([^"]+)"\)/g)].map((match) => match[1]),
    ),
  );
  const symbols = [
    ...(
      /WellKnownSymbols ==([^>]*)>>/.exec(
        library.definitions.get("WellKnownSymbols")?.text ?? "",
      )?.[1] ?? ""
    ).matchAll(/"([^"]+)"/g),
  ].map((match) => match[1]);
  // What the host's Intl gives of a tag, or undefined where it isn't a structurally valid tag.
  const getLocale = (tag: string): HostLocale | undefined => {
    const canonical = (() => {
      try {
        return Intl.getCanonicalLocales(tag)[0];
      } catch {
        return undefined;
      }
    })();
    if (canonical === undefined) return undefined;
    const getSupported = (localeMatcher: string) =>
      LOCALE_SERVICES.filter((service) => {
        const supported: unknown = Reflect.apply(
          Reflect.get(Reflect.get(Intl, service), "supportedLocalesOf"),
          undefined,
          [canonical, { localeMatcher }],
        );
        return Array.isArray(supported) && supported.length > 0;
      });
    const lookup = getSupported("lookup");
    const bestFit = getSupported("best fit");
    return {
      canonical,
      lookup,
      bestFit,
      differs: LOCALE_SERVICES.filter(
        (service) => lookup.includes(service) !== bestFit.includes(service),
      ),
    };
  };
  const defaults = new Intl.DateTimeFormat().resolvedOptions();
  return {
    scriptGlobals: getHostOnlyGlobals(scriptGlobal),
    moduleGlobals: getHostOnlyGlobals(globalThis).map((name) => ({
      name,
      // Node warns where code reads localStorage without --localstorage-file, so tla-ts reads
      // only its descriptor, and a program that reads it stops.
      record: getHostProperty(
        "GlobalObject",
        name,
        Object.getOwnPropertyDescriptor(globalThis, name),
        name === "localStorage" ? undefined : globalThis,
      ),
    })),
    builtInProperties: [...new Set(library.properties.map((property) => property.owner))].flatMap(
      (owner) => {
        const object = owner === "GlobalObject" ? undefined : getHostObject(owner);
        return object === undefined
          ? []
          : Object.getOwnPropertyNames(object)
              .filter((key) => !known.has(key))
              .map((key) => ({
                owner,
                key,
                record: getHostProperty(
                  owner,
                  key,
                  Object.getOwnPropertyDescriptor(object, key),
                  undefined,
                ),
              }));
      },
    ),
    missingProperties: library.properties
      .filter((property) => {
        const object = getHostObject(property.owner);
        return object !== undefined && !(property.key in object);
      })
      .map((property) => ({ owner: property.owner, key: property.key })),
    keyOrders: [
      ...new Set([
        "GlobalObject",
        ...library.properties.map((property) => property.owner),
        ...[...library.definitions.values()].flatMap((definition) =>
          [...definition.text.matchAll(/\b(?:IntrinsicObject|Ctor)\("([A-Za-z0-9_]+)"/g)].map(
            (match) => match[1],
          ),
        ),
      ]),
    ].flatMap((owner) => {
      const object = getHostObject(owner);
      return object === undefined
        ? []
        : [
            {
              owner,
              keys: Reflect.ownKeys(object).flatMap<string | number>((key) => {
                if (typeof key === "string") return [key];
                const index = symbols.indexOf(key.description ?? "");
                return index === -1 ? [] : [index + 1];
              }),
            },
          ];
    }),
    locale: defaults.locale,
    timeZone: defaults.timeZone,
    zoneName: / \(.*\)$/.exec(new Date(0).toString())?.[0] ?? "",
    parseDate: (text) => Date.parse(text),
    isRejectedZone: (name) => {
      const temporal: unknown = Reflect.get(scriptGlobal, "Temporal");
      if (typeof temporal !== "object" || temporal === null) return false;
      const zoned: unknown = Reflect.get(temporal, "ZonedDateTime");
      if (typeof zoned !== "function") return false;
      try {
        Reflect.construct(zoned, [0n, name]);
        return false;
      } catch {
        return true;
      }
    },
    getLocale,
    recordedLocales: RECORDED_LOCALE_TAGS.map((tag) => ({ tag, locale: getLocale(tag) })),
  };
};
