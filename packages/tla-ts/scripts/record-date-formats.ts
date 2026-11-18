// Records how Temporal's toLocaleString formats each kind of object in English into
// src/typescript/date-formats.ts: for each option bag of a set it enumerates, the error that Node
// throws, or the pattern of parts that its output follows, where the pattern gives Node's output
// for every sample date and time that it checks.
// Usage: bun scripts/run.ts record-date-formats (with a Node that has Temporal)

import { writeFileSync } from "node:fs";
import { join } from "node:path";

type Value = string | boolean | number;

const KEYS = [
  "hour12",
  "hourCycle",
  "weekday",
  "era",
  "year",
  "month",
  "day",
  "hour",
  "minute",
  "second",
  "fractionalSecondDigits",
  "dateStyle",
  "timeStyle",
];

const STYLES = ["full", "long", "medium", "short"];
const CYCLES: Record<string, Value>[] = [
  { hour12: true },
  { hour12: false },
  ...["h11", "h12", "h23", "h24"].map((hourCycle) => ({ hourCycle })),
];
const COMPONENTS: Record<string, Value[]> = {
  weekday: ["long", "short", "narrow"],
  era: ["long", "short", "narrow"],
  year: ["numeric", "2-digit"],
  month: ["numeric", "2-digit", "long", "short", "narrow"],
  day: ["numeric", "2-digit"],
  hour: ["numeric", "2-digit"],
  minute: ["numeric", "2-digit"],
  second: ["numeric", "2-digit"],
  fractionalSecondDigits: [1, 2, 3],
};

const BAGS: Record<string, Value>[] = [
  {},
  ...STYLES.map((dateStyle) => ({ dateStyle })),
  ...STYLES.map((timeStyle) => ({ timeStyle })),
  ...STYLES.flatMap((dateStyle) => STYLES.map((timeStyle) => ({ dateStyle, timeStyle }))),
  ...Object.entries(COMPONENTS).flatMap(([key, values]) =>
    values.map((value) => ({ [key]: value })),
  ),
  ...CYCLES,
  ...CYCLES.flatMap((cycle) => [
    { ...cycle, hour: "numeric" },
    ...STYLES.map((timeStyle) => ({ ...cycle, timeStyle })),
  ]),
];

const KINDS = [
  "PlainDate",
  "PlainTime",
  "PlainDateTime",
  "PlainYearMonth",
  "PlainMonthDay",
  "Instant",
];
const CALENDARS = ["iso8601", "gregory"];

interface Sample {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

const make = (kind: string, calendar: string, sample: Sample) => {
  const date = new Temporal.PlainDate(sample.year, sample.month, sample.day, calendar);
  const time = new Temporal.PlainTime(
    sample.hour,
    sample.minute,
    sample.second,
    sample.millisecond,
  );
  if (kind === "PlainDate") return date;
  if (kind === "PlainTime") return time;
  if (kind === "PlainDateTime") return date.toPlainDateTime(time);
  if (kind === "PlainYearMonth") return date.toPlainYearMonth();
  if (kind === "PlainMonthDay") return date.toPlainMonthDay();
  return date.toPlainDateTime(time).toZonedDateTime("UTC").toInstant();
};

const format = (kind: string, calendar: string, sample: Sample, bag: Record<string, Value>) => {
  try {
    return { text: make(kind, calendar, sample).toLocaleString("en", bag) };
  } catch (error) {
    return { error: error instanceof Error ? error.name : "Error" };
  }
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// The text of a field of a sample in a style.
const render = (field: string, style: string, sample: Sample) => {
  const pad = (value: number) =>
    style === "2-digit" ? String(value).padStart(2, "0").slice(-2) : String(value);
  const weekday = new Temporal.PlainDate(sample.year, sample.month, sample.day).dayOfWeek - 1;
  const named = (name: string) =>
    style === "long" ? name : style === "short" ? name.slice(0, 3) : name.slice(0, 1);
  const hour = sample.hour;
  switch (field) {
    case "year":
      return pad(sample.year);
    case "month":
      return ["numeric", "2-digit"].includes(style)
        ? pad(sample.month)
        : named(MONTHS[sample.month - 1]);
    case "day":
      return pad(sample.day);
    case "weekday":
      return named(WEEKDAYS[weekday]);
    case "era":
      return style === "long" ? "Anno Domini" : style === "short" ? "AD" : "A";
    case "dayPeriod":
      return hour < 12 ? "AM" : "PM";
    case "minute":
      return pad(sample.minute);
    case "second":
      return pad(sample.second);
    case "fraction":
      return String(sample.millisecond).padStart(3, "0").slice(0, Number(style));
    default: {
      const [cycle, width] = style.split(" ");
      const value =
        cycle === "h23"
          ? hour
          : cycle === "h24"
            ? hour || 24
            : cycle === "h11"
              ? hour % 12
              : hour % 12 || 12;
      return width === "2-digit" ? String(value).padStart(2, "0") : String(value);
    }
  }
};

interface Part {
  field: string;
  style: string;
}

const renderAll = (parts: Part[], sample: Sample) =>
  parts
    .map((part) => (part.field === "literal" ? part.style : render(part.field, part.style, sample)))
    .join("");

// The patterns that a sample's output may follow: each way to read its fields from the text.
const FIRST: Sample = {
  year: 2001,
  month: 11,
  day: 23,
  hour: 14,
  minute: 35,
  second: 47,
  millisecond: 987,
};
const TOKENS: Part[][] = [
  ["weekday", ["long", "short", "narrow"]],
  ["month", ["long", "short", "narrow"]],
  ["era", ["long", "short", "narrow"]],
].flatMap(([field, styles]) =>
  (styles as string[]).map((style) => [{ field: field as string, style }]),
);

const getCandidates = (text: string): Part[][] => {
  if (text === "") return [[]];
  const options: { part: Part; length: number }[] = [];
  for (const [part] of TOKENS) {
    const value = render(part.field, part.style, FIRST);
    if (text.startsWith(value) && !/[A-Za-z]/.test(text.charAt(value.length))) {
      options.push({ part, length: value.length });
    }
  }
  if (text.startsWith("AM") || text.startsWith("PM")) {
    options.push({ part: { field: "dayPeriod", style: "short" }, length: 2 });
  }
  const digits = /^\d+/.exec(text)?.[0];
  if (digits !== undefined) {
    const numeric: Part[] = [
      ...["numeric", "2-digit"].flatMap((style) =>
        ["year", "month", "day", "minute", "second"].map((field) => ({ field, style })),
      ),
      ...["h11", "h12", "h23", "h24"].flatMap((cycle) =>
        ["numeric", "2-digit"].map((width) => ({ field: "hour", style: `${cycle} ${width}` })),
      ),
      ...["1", "2", "3"].map((style) => ({ field: "fraction", style })),
    ];
    for (const part of numeric) {
      if (render(part.field, part.style, FIRST) === digits)
        options.push({ part, length: digits.length });
    }
  }
  if (options.length > 0) {
    return options.flatMap((option) =>
      getCandidates(text.slice(option.length)).map((rest) => [option.part, ...rest]),
    );
  }
  const literal = /^[^\dA-Z]+|^[A-Za-z]+/.exec(text)?.[0] ?? text.charAt(0);
  return getCandidates(text.slice(literal.length)).map((rest) => [
    { field: "literal", style: literal },
    ...rest,
  ]);
};

// A deterministic generator of samples, from 1583, as Node writes an earlier date in the Julian
// calendar, to 9999.
const getSamples = () => {
  let seed = 12345;
  const next = (limit: number) => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed % limit;
  };
  return Array.from({ length: 200 }, (_, position): Sample => {
    const year = position < 3 ? [1583, 2000, 9999][position] : 1583 + next(8417);
    const month = 1 + next(12);
    return {
      year,
      month,
      day: 1 + next(new Temporal.PlainYearMonth(year, month).daysInMonth),
      hour: position % 24,
      minute: next(60),
      second: next(60),
      millisecond: next(1000),
    };
  });
};
const SAMPLES = getSamples();

const merge = (parts: Part[]) =>
  parts.reduce<Part[]>((merged, part) => {
    const last = merged.at(-1);
    return last?.field === "literal" && part.field === "literal"
      ? [...merged.slice(0, -1), { field: "literal", style: last.style + part.style }]
      : [...merged, part];
  }, []);

const getKey = (kind: string, calendar: string, bag: Record<string, Value>) =>
  [
    kind,
    calendar,
    ...KEYS.filter((key) => key in bag).map((key) => `${key}=${String(bag[key])}`),
  ].join("|");

const entries: string[] = [];
for (const kind of KINDS) {
  for (const calendar of CALENDARS) {
    for (const bag of BAGS) {
      const first = format(kind, calendar, FIRST, bag);
      const key = getKey(kind, calendar, bag);
      if (first.error !== undefined) {
        const isSteady = SAMPLES.every(
          (sample) => format(kind, calendar, sample, bag).error === first.error,
        );
        if (isSteady)
          entries.push(`  ${JSON.stringify(key)}: ${JSON.stringify({ error: first.error })},`);
        continue;
      }
      const pattern = getCandidates(first.text)
        .map(merge)
        .find((parts) =>
          SAMPLES.every(
            (sample) => format(kind, calendar, sample, bag).text === renderAll(parts, sample),
          ),
        );
      if (pattern === undefined) {
        if (process.env.DEBUG_FORMATS && key === process.env.DEBUG_FORMATS) {
          const candidates = getCandidates(first.text).map(merge);
          console.error(
            JSON.stringify(first.text),
            candidates.length,
            JSON.stringify(candidates.slice(0, 3)),
          );
          for (const parts of candidates.slice(0, 3)) {
            const bad = SAMPLES.find(
              (sample) => format(kind, calendar, sample, bag).text !== renderAll(parts, sample),
            );
            if (bad)
              console.error(
                JSON.stringify(bad),
                JSON.stringify(format(kind, calendar, bad, bag).text),
                JSON.stringify(renderAll(parts, bad)),
              );
          }
        }
        continue;
      }
      // A pattern that the time zone option doesn't change, where the object's own fields, or an
      // instant's in the time zone, give it.
      const isZoned = SAMPLES.slice(0, 40).every((sample) => {
        const zoned = format(kind, calendar, sample, { ...bag, timeZone: "America/New_York" });
        if (kind !== "Instant") return zoned.text === renderAll(pattern, sample);
        const local = make(kind, calendar, sample) as Temporal.Instant;
        const shifted = local.toZonedDateTimeISO("America/New_York");
        return (
          zoned.text ===
          renderAll(pattern, {
            year: shifted.year,
            month: shifted.month,
            day: shifted.day,
            hour: shifted.hour,
            minute: shifted.minute,
            second: shifted.second,
            millisecond: shifted.millisecond,
          })
        );
      });
      entries.push(
        `  ${JSON.stringify(key)}: ${JSON.stringify({
          fields: pattern.map((part) => part.field),
          styles: pattern.map((part) => part.style),
          isZoned,
        })},`,
      );
    }
  }
}

const header = `// Generated by scripts/record-date-formats.ts from Node ${process.version}. Do not edit.
// How Temporal's toLocaleString formats in English, by the kind of object, its calendar, and the
// options that a bag gives, in a fixed order: the error that it throws, or the fields of its
// pattern with their styles, where a literal's style is its text, and whether the time zone option
// gives an instant's fields and leaves the pattern as it is.

export interface DateFormat {
  error?: string;
  fields?: string[];
  styles?: string[];
  isZoned?: boolean;
}

export const DATE_FORMAT_KEYS = ${JSON.stringify(KEYS)};

export const DATE_FORMATS: Record<string, DateFormat> = {
`;
writeFileSync(
  join(import.meta.dirname, "..", "src", "typescript", "date-formats.ts"),
  `${header}${entries.join("\n")}\n};\n`,
);
console.log(entries.length);
