// Records the named time zones that Node takes into src/typescript/time-zones.ts: each zone and
// link of the system's tzdata, of the version that Node's is, each that Intl.supportedValuesOf
// gives, and each that test262's Temporal tests name.
// Each has its offsets and the instants it changes them at, through 2037, as the Node that runs it
// gives them, and the rule of its later transitions that the tzdata gives where Node agrees with
// it. Zones whose transitions are the same share them. For each zone named by a prefix and a
// number, such as Etc/GMT-1, it records the names of that prefix and up to three digits that Node
// rejects, so that a program that joins such a name of parts tells them.
// Usage: bun scripts/run.ts record-time-zones (with a Node that has Temporal)

import { readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { listTest262Files, TEST262_DIRECTORY } from "./corpora";

const END_SECONDS = Date.UTC(2038, 0, 1) / 1000;

const isNamedZone = (text: string) => {
  if (/^[+-]\d/.test(text) || text.length < 2) return false;
  try {
    return !/^[+-]/.test(new Temporal.ZonedDateTime(0n, text).timeZoneId);
  } catch {
    return false;
  }
};

const getNames = (text: string) =>
  [...text.matchAll(/["'`]([^"'`\n]{1,60})["'`]/g)].flatMap((match) => [
    match[1],
    ...[...match[1].matchAll(/\[!?([^\]=]+)\]/g)].map((annotation) => annotation[1]),
  ]);

const TZDATA = readFileSync("/usr/share/zoneinfo/tzdata.zi", "utf8");
const keys = new Set(
  [
    ...listTest262Files()
      .filter((path) => /^(intl402|built-ins)\/Temporal\//.test(relative(TEST262_DIRECTORY, path)))
      .flatMap((path) => getNames(readFileSync(path, "utf8"))),
    ...Intl.supportedValuesOf("timeZone"),
    ...[...TZDATA.matchAll(/^Z (\S+)/gm)].map((match) => match[1]),
    ...[...TZDATA.matchAll(/^L \S+ (\S+)/gm)].map((match) => match[1]),
  ]
    .filter(isNamedZone)
    .map((zone) => zone.toLowerCase()),
);
keys.delete("utc");

// The transitions of a zone before the end, as their epoch seconds and the offsets in seconds that
// they start, and whether the zone changes its offset again after them.
const getTransitions = (key: string) => {
  const times: number[] = [];
  const offsets: number[] = [];
  const step = (zoned: Temporal.ZonedDateTime): boolean => {
    const next = zoned.getTimeZoneTransition("next");
    if (next === null) return true;
    if (next.epochMilliseconds / 1000 >= END_SECONDS) return false;
    times.push(next.epochMilliseconds / 1000);
    offsets.push(next.offsetNanoseconds / 1e9);
    return step(next);
  };
  const first = new Temporal.ZonedDateTime(-8640000000000000000000n, key);
  const isFinal = step(first);
  return { times, offsets: [first.offsetNanoseconds / 1e9, ...offsets], isFinal };
};

// The rule of a POSIX TZ string, such as "CET-1CEST,M3.5.0,M10.5.0/3", as a zone's standard and
// daylight offsets in seconds east, and the month, the week, where 5 is the last, the weekday, from
// Sunday as 0, and the local time in seconds of the start of daylight time and of its end.
const parsePosixRule = (text: string) => {
  const match =
    /^(?:[A-Za-z]{3,}|<[^>]+>)([+-]?\d+(?::\d+){0,2})(?:[A-Za-z]{3,}|<[^>]+>)([+-]?\d+(?::\d+){0,2})?,M(\d+)\.(\d)\.(\d)(?:\/([+-]?\d+(?::\d+){0,2}))?,M(\d+)\.(\d)\.(\d)(?:\/([+-]?\d+(?::\d+){0,2}))?$/.exec(
      text,
    );
  if (match === null) return undefined;
  const getSeconds = (time: string) => {
    const sign = time.startsWith("-") ? -1 : 1;
    const [hours, minutes = 0, seconds = 0] = time.replace(/^[+-]/, "").split(":").map(Number);
    return sign * (hours * 3600 + minutes * 60 + seconds);
  };
  const standard = -getSeconds(match[1]);
  const daylight = match[2] === undefined ? standard + 3600 : -getSeconds(match[2]);
  return [
    standard,
    daylight,
    ...[3, 4, 5].map((position) => Number(match[position])),
    match[6] === undefined ? 7200 : getSeconds(match[6]),
    ...[7, 8, 9].map((position) => Number(match[position])),
    match[10] === undefined ? 7200 : getSeconds(match[10]),
  ];
};

// The epoch seconds of the start and the end of daylight time in a year under a rule.
const getRuleTransitions = (rule: number[], year: number) => {
  const getLocal = (month: number, week: number, weekday: number, time: number) => {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const day = 1 + ((weekday - first + 7) % 7) + 7 * (week - 1);
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day > length ? day - 7 : day);
    return date.getTime() / 1000 + time;
  };
  return [
    getLocal(rule[2], rule[3], rule[4], rule[5]) - rule[0],
    getLocal(rule[6], rule[7], rule[8], rule[9]) - rule[1],
  ];
};

// The rule that the zone's tzdata file ends with, where the transitions that Node gives from 2030
// on, and at a few far years, agree with it.
const getRule = (id: string, times: number[]) => {
  const text =
    readFileSync(join("/usr/share/zoneinfo", id), "utf8").trim().split("\n").at(-1) ?? "";
  const rule = parsePosixRule(text);
  if (rule === undefined || [rule[2], rule[6]].some((month) => month === 1 || month === 12)) {
    return undefined;
  }
  const getNodeNext = (seconds: number) =>
    new Temporal.ZonedDateTime(BigInt(seconds) * 1000000000n, id).getTimeZoneTransition("next");
  const isAgreed = (year: number) => {
    const expected = getRuleTransitions(rule, year).sort((left, right) => left - right);
    const start = Date.UTC(year, 0, 1) / 1000;
    const first = getNodeNext(start);
    const second = first === null ? null : first.getTimeZoneTransition("next");
    return (
      first !== null &&
      second !== null &&
      first.epochMilliseconds / 1000 === expected[0] &&
      second.epochMilliseconds / 1000 === expected[1]
    );
  };
  const years = [
    ...Array.from({ length: 371 }, (_, position) => 2030 + position),
    10000,
    100000,
    275000,
  ];
  const isTable = times
    .filter((time) => time >= Date.UTC(2030, 0, 1) / 1000)
    .every((time) =>
      [2030, 2031, 2032, 2033, 2034, 2035, 2036, 2037].some((year) =>
        getRuleTransitions(rule, year).includes(time),
      ),
    );
  return isTable && years.every(isAgreed) ? rule : undefined;
};

const sorted = [...keys].sort();
// A zone's primary identifier, by which zones compare: UTC for the zones that equal it, which
// tla-ts reads without a table, and otherwise the first recorded zone that equals it.
const getPrimary = (key: string) =>
  new Temporal.ZonedDateTime(
    0n,
    ["UTC", ...sorted].find((other) =>
      new Temporal.ZonedDateTime(0n, key).equals(new Temporal.ZonedDateTime(0n, other)),
    ) ?? key,
  ).timeZoneId;

// Each zone's transitions, under the first key of the zones that have them.
const shared = new Map<string, string>();
const data: string[] = [];
const entries = sorted.map((key) => {
  const transitions = getTransitions(key);
  const id = new Temporal.ZonedDateTime(0n, key).timeZoneId;
  const text = JSON.stringify({
    ...transitions,
    rule: transitions.isFinal ? [] : (getRule(id, transitions.times) ?? []),
  });
  if (!shared.has(text)) {
    shared.set(text, key);
    data.push(`  ${JSON.stringify(key)}: ${text},`);
  }
  return `  ${JSON.stringify(key)}: ${JSON.stringify({ id, primary: getPrimary(key), data: shared.get(text) })},`;
});

const numbered = [...new Set(sorted.flatMap((key) => /^(.*[+-])\d+$/.exec(key)?.[1] ?? []))];
const rejected = numbered.flatMap((prefix) =>
  Array.from({ length: 1110 }, (_, index) =>
    index < 10
      ? String(index)
      : index < 110
        ? String(index - 10).padStart(2, "0")
        : String(index - 110).padStart(3, "0"),
  )
    .map((digits) => prefix + digits)
    .filter((name) => {
      try {
        Reflect.construct(Temporal.ZonedDateTime, [0n, name]);
        return false;
      } catch {
        return true;
      }
    }),
);

const header = `// Generated by scripts/record-time-zones.ts from Node ${process.version}. Do not edit.
// Each named time zone by its lowercase name: its identifier, its primary identifier, and the key
// of its transitions in TIME_ZONE_DATA: the epoch seconds of its transitions before 2038, its
// offsets in seconds, the first before any transition, whether it has no transition after them,
// and otherwise the rule of its later transitions, or none where Node's don't follow its tzdata
// rule: its standard and daylight offsets in seconds, and the month, week, weekday, and local time
// in seconds of the start and of the end of daylight time.

export interface TimeZoneTable {
  id: string;
  primary: string;
  data: string;
}

export interface TimeZoneData {
  times: number[];
  offsets: number[];
  isFinal: boolean;
  rule: number[];
}

export const TIME_ZONES: Record<string, TimeZoneTable> = {
`;
writeFileSync(
  join(import.meta.dirname, "..", "src", "typescript", "time-zones.ts"),
  `${header}${entries.join("\n")}\n};\n\nexport const TIME_ZONE_DATA: Record<string, TimeZoneData> = {\n${data.join("\n")}\n};\n\n// The names of a numbered zone's prefix and up to three digits that Node rejects, in lowercase.\nexport const REJECTED_TIME_ZONES: string[] = [\n${rejected.map((name) => `  ${JSON.stringify(name)},`).join("\n")}\n];\n`,
);
