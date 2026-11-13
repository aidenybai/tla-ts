import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { version } from "../../../package.json";
import { TlaProofError } from "../../errors";
import {
  createBlock,
  isBlock,
  readMarshaled,
  writeMarshaled,
  type OcamlValue,
} from "./ocaml-marshal";
import { getBudget } from "../prep/methods";
import { getFailureReason, isProvedAttempt, type ProofAttempt } from "../prove";
import { BACKENDS, type Backend } from "../verdict";

export type FingerprintTable = Map<string, OcamlValue[]>;

const MAGIC_NUMBER = 20210223;

const RECORD_SIZE = 23;

const PROVERS: Record<Backend, { field: number; tag: number }> = {
  zenon: { field: 1, tag: 1 },
  isabelle: { field: 2, tag: 0 },
  smt: { field: 10, tag: 8 },
  z3: { field: 11, tag: 9 },
  ls4: { field: 17, tag: 16 },
};

const FAIL_METHOD = 5;

const REASONS = ["false", "timeout"];

const VERSION = `tla-ts ${version}`;

const CHECKED_VERSIONS = new Map([
  [PROVERS.zenon.field, 3],
  [PROVERS.isabelle.field, 4],
]);

const HISTORY_SIZE = 10;

const getField = (value: OcamlValue | undefined, index: number) =>
  value !== undefined && isBlock(value) ? value.fields[index] : undefined;

const getFloat = (value: OcamlValue | undefined) =>
  value !== undefined && typeof value === "object" && "float" in value ? value.float : Infinity;

const hashKey = (key: string) => {
  const bytes = new TextEncoder().encode(key);
  const rotate = (value: number, shift: number) => (value << shift) | (value >>> (32 - shift));
  const mixed = Array.from(
    { length: Math.ceil(bytes.length / 4) },
    (_value, index) =>
      bytes[index * 4] |
      (bytes[index * 4 + 1] << 8) |
      (bytes[index * 4 + 2] << 16) |
      (bytes[index * 4 + 3] << 24),
  ).reduce((hash, word) => {
    const data = Math.imul(rotate(Math.imul(word, 0xcc9e2d51), 15), 0x1b873593);
    return (Math.imul(rotate(hash ^ data, 13), 5) + 0xe6546b64) | 0;
  }, 0);
  const first = Math.imul(mixed ^ bytes.length ^ ((mixed ^ bytes.length) >>> 16), 0x85ebca6b);
  const second = Math.imul(first ^ (first >>> 13), 0xc2b2ae35);
  return (second ^ (second >>> 16)) & 0x3fffffff;
};

const readBucket = (entry: OcamlValue | undefined): [OcamlValue, OcamlValue][] =>
  entry !== undefined && isBlock(entry)
    ? [[entry.fields[0], entry.fields[1]], ...readBucket(entry.fields[2])]
    : [];

export const loadFingerprints = (table: FingerprintTable, path: string, isSafe: boolean) => {
  const bytes = readFileSync(path);
  const magic = readMarshaled(bytes, 0);
  const contents = readMarshaled(bytes, magic.next).value;
  if (magic.value !== MAGIC_NUMBER || !isBlock(contents) || contents.tag !== 0)
    throw new TlaProofError("corrupted fingerprint file");
  const buckets = getField(getField(contents, 0), 1);
  const isTrusted = (result: OcamlValue, field: number) => {
    const index = CHECKED_VERSIONS.get(field);
    return !isSafe || index === undefined || getField(getField(result, 0), index) === VERSION;
  };
  table.clear();
  (buckets !== undefined && isBlock(buckets) ? buckets.fields : [])
    .flatMap((bucket) => readBucket(bucket).toReversed())
    .forEach(([key, record]) => {
      if (typeof key !== "string" || !isBlock(record))
        throw new TlaProofError("corrupted fingerprint file");
      table.set(
        key,
        record.fields.map((result, field) => (isTrusted(result, field) ? result : 0)),
      );
    });
};

const decodeResult = (
  prover: Backend,
  result: OcamlValue | undefined,
): ProofAttempt | undefined => {
  const status = getField(result, 0);
  const outcome = getField(status, 0);
  const argument = getField(getField(status, 1), 0);
  if (outcome === undefined || outcome === 1) return undefined;
  const seconds = getFloat(getField(prover === "isabelle" ? getField(argument, 0) : argument, 0));
  const tactic = prover === "isabelle" ? getField(argument, 1) : undefined;
  const reason = getField(getField(outcome, 0), 0);
  return {
    kind: "stored",
    method: {
      prover,
      timeLimitMs: seconds * 1000,
      ...(typeof tactic === "string" && { tactic }),
    },
    isProved: outcome === 0,
    ...(reason !== undefined && {
      reason: typeof reason === "number" ? REASONS[reason] : String(getField(reason, 0)),
    }),
  };
};

// Fpfile.fp_writes, whose date counts months from 0.
const encodeResult = (prover: Backend, attempt: ProofAttempt) => {
  const now = new Date();
  const method = attempt.method;
  const timeout = { float: getBudget(method) };
  const argument =
    prover === "zenon"
      ? createBlock(0, timeout, FAIL_METHOD)
      : prover === "isabelle"
        ? createBlock(0, createBlock(0, timeout), method.tactic ?? "auto")
        : createBlock(0, timeout);
  const failure = getFailureReason(attempt);
  const reasonIndex = REASONS.indexOf(failure ?? "");
  const reason =
    failure === undefined
      ? 0
      : createBlock(0, reasonIndex === -1 ? createBlock(0, failure) : reasonIndex);
  return createBlock(
    0,
    createBlock(
      0,
      createBlock(
        0,
        isProvedAttempt(attempt) ? 0 : createBlock(0, reason),
        createBlock(PROVERS[prover].tag, argument),
      ),
      createBlock(
        0,
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
      ),
      VERSION,
      VERSION,
      VERSION,
    ),
  );
};

const encodeTable = (table: FingerprintTable) => {
  const length = 2 ** Math.max(9, Math.ceil(Math.log2(table.size / 2)));
  const buckets: OcamlValue[] = Array.from({ length }, () => 0);
  table.forEach((record, fingerprint) => {
    const index = hashKey(fingerprint) & (length - 1);
    buckets[index] = createBlock(0, fingerprint, createBlock(0, ...record), buckets[index]);
  });
  return createBlock(0, createBlock(0, table.size, createBlock(0, ...buckets), 0, 512));
};

const pad = (value: number) => String(value).padStart(2, "0");

export const saveHistory = (path: string, sources: string[]) => {
  const now = new Date();
  const history = `${path}.history`;
  const directory = join(
    history,
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}_${pad(now.getMinutes())}_${pad(now.getSeconds())}`,
  );
  mkdirSync(directory, { recursive: true });
  [path, ...sources]
    .filter((file) => existsSync(file))
    .forEach((file) => cpSync(file, join(directory, basename(file)), { preserveTimestamps: true }));
  readdirSync(history)
    .map((name) => join(history, name))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs)
    .slice(HISTORY_SIZE)
    .forEach((old) => rmSync(old, { recursive: true, force: true }));
};

export const getKnownResults = (table: FingerprintTable) => {
  const storedResults = new Map<ProofAttempt, OcamlValue>();
  const storedRecords = new Map<Map<string, ProofAttempt>, OcamlValue[]>();
  const results = new Map(
    [...table].map(([fingerprint, record]) => {
      const attempts = new Map(
        BACKENDS.flatMap((prover) => {
          const stored = record[PROVERS[prover].field];
          const result = decodeResult(prover, getField(stored, 0));
          if (!result) return [];
          storedResults.set(result, stored);
          return [[prover, result]];
        }),
      );
      storedRecords.set(attempts, record);
      return [fingerprint, attempts];
    }),
  );
  const save = (path: string) => {
    table.clear();
    results.forEach((attempts, fingerprint) => {
      const record = [...(storedRecords.get(attempts) ?? Array<OcamlValue>(RECORD_SIZE).fill(0))];
      BACKENDS.forEach((prover) => {
        const attempt = attempts.get(prover);
        if (attempt)
          record[PROVERS[prover].field] =
            storedResults.get(attempt) ?? encodeResult(prover, attempt);
      });
      table.set(fingerprint, record);
    });
    writeFileSync(
      `${path}.tmp`,
      Buffer.concat([writeMarshaled(MAGIC_NUMBER), writeMarshaled(encodeTable(table))]),
    );
    renameSync(`${path}.tmp`, path);
  };
  return { results, save };
};
