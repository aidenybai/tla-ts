import { readFileSync } from "node:fs";
import { join } from "node:path";
import { constants, deflateRawSync, gunzipSync, gzipSync } from "node:zlib";
import { describe, expect, it } from "vite-plus/test";
import { check, type CheckResult } from "../../src";
import { getModuleLoader } from "./check-harness";

const FIXTURES = join(import.meta.dirname, "../fixtures");

const readFixture = (path: string) => readFileSync(join(FIXTURES, path));

const readText = (path: string) => readFileSync(join(FIXTURES, path), "utf8");

const TRACE_PATH = "trace.bin";

const DIE_HARDER_TRACE = readFixture("load-trace/MCDieHarder.bin");

const DIE_HARDER_PAYLOAD = gunzipSync(DIE_HARDER_TRACE);

type TraceModule = "_TLCTrace" | "_JsonTrace";

const loadTrace = (
  source: string,
  config: string,
  trace: Uint8Array | undefined,
  module: TraceModule = "_TLCTrace",
  onRead = () => {},
) => {
  const constants = { [`${module}InputFile`]: TRACE_PATH };
  return check({
    source,
    config,
    loadModule: getModuleLoader("load-trace"),
    moduleOperators: [
      { kind: "constraint", module, operator: `${module}Constraint`, constants },
      { kind: "view", module, operator: `${module}View`, constants },
    ],
    readFile: (path) => {
      onRead();
      return path === TRACE_PATH ? trace : undefined;
    },
  });
};

const loadDieHarder = (trace: Uint8Array | undefined) =>
  loadTrace(readText("load-trace/MCDieHarder.tla"), readText("load-trace/MCDieHarder.cfg"), trace);

const dumpTrace = async (source: string, config: string, module: TraceModule = "_TLCTrace") => {
  let dumped: Uint8Array | undefined;
  await check({
    source,
    config,
    loadModule: getModuleLoader("load-trace"),
    moduleOperators: [
      {
        kind: "postcondition",
        module,
        operator: module,
        constants: { [`${module}File`]: TRACE_PATH },
      },
    ],
    onPrint: () => {},
    writeFile: (_path, content) => {
      dumped = typeof content === "string" ? new TextEncoder().encode(content) : content;
    },
  });
  return dumped;
};

const getOutcome = (result: CheckResult) => ({
  status: result.status,
  violation: result.violation?.name,
  generated: result.generatedStates,
  distinct: result.distinctStates,
});

const getJavaError = (message: string) =>
  `Attempted to apply the operator overridden by the Java method\npublic static final tlc2.value.IValue tlc2.module._TLCTrace.ioDeserialize(tlc2.value.impl.StringValue) throws java.io.IOException,\nbut it produced the following error:\n${message}`;

const gzip = (bytes: number[]) => gzipSync(Uint8Array.from(bytes));

const withByte = (bytes: Uint8Array, offset: number, value: number) => {
  const copy = Uint8Array.from(bytes);
  copy[offset] = value;
  return copy;
};

const getKind99Payload = (size: number) => {
  const payload = new Uint8Array(size);
  payload[0] = 99;
  return payload;
};

const withBadCrc = (size: number) => {
  const bytes = gzipSync(getKind99Payload(size), { level: 0 });
  return withByte(bytes, bytes.length - 9, 1);
};

const GZIP_HEADER = [0x1f, 0x8b, 8, 0, 0, 0, 0, 0, 0, 3];

const withBadBlock = (size: number) =>
  Uint8Array.from([
    ...GZIP_HEADER,
    0,
    size & 0xff,
    size >> 8,
    ~size & 0xff,
    (~size >> 8) & 0xff,
    ...getKind99Payload(size),
    0x07,
  ]);

const withBadSecondMember = (size: number) =>
  Uint8Array.from([...gzip([99]), ...withBadBlock(size)]);

const withDenseBadBlock = (size: number) =>
  Uint8Array.from([
    ...GZIP_HEADER,
    ...deflateRawSync(getKind99Payload(size), { finishFlush: constants.Z_SYNC_FLUSH }),
    0x07,
  ]);

const KIND_99 = "ValueInputStream: Can not unpickle a value of kind 99";

const getStringBytes = (text: string) =>
  [3, ...Array(11).fill(0), text.length].concat(
    Array.from(text, (character) => character.charCodeAt(0)),
  );

const STRING_A = getStringBytes("a");

const getRecordBytes = (fields: [string, number[]][]) =>
  [4, 0, 0, 0, fields.length].concat(
    ...fields.map((field) => [...getStringBytes(field[0]), ...field[1]]),
  );

const EMPTY_SET = [5, 0, 0, 0, 0];

const getNestedTrace = (depth: number) =>
  gzip(
    getRecordBytes([
      [
        "counterexample",
        getRecordBytes([
          ["state", EMPTY_SET],
          ["action", EMPTY_SET],
        ]),
      ],
      ["vars", EMPTY_SET],
      ["deep", [...Array(depth).fill([7, 0, 1]).flat(), 1, 0, 0, 0, 1]],
    ]),
  );

const getIntegerBytes = (value: number) => [1, 0, 0, 0, value];

const getSetBytes = (elements: number[]) =>
  [5, 0, 0, 0, elements.length].concat(...elements.map(getIntegerBytes));

const getFunctionBytes = (info: number, keys: number[]) =>
  [9, 0, keys.length, info].concat(
    ...keys.map((key) => [...getIntegerBytes(key), ...getIntegerBytes(1)]),
  );

const getStateTrace = (value: number[]) =>
  gzip(
    getRecordBytes([
      [
        "counterexample",
        getRecordBytes([
          [
            "state",
            [5, 0, 0, 0, 1, 7, 0, 2, ...getIntegerBytes(1), ...getRecordBytes([["x", value]])],
          ],
          ["action", EMPTY_SET],
        ]),
      ],
      ["vars", [5, 0, 0, 0, 1, ...getStringBytes("x")]],
    ]),
  );

const SINGLE_STATE_SOURCE =
  "---- MODULE T ----\nVARIABLE x\nInit == x = 0\nNext == UNCHANGED x\n====";

const SINGLE_STATE_CONFIG = "INIT Init\nNEXT Next";

describe("-loadTrace tlc matches TLC", () => {
  it("loads TLC's trace of MCDieHarder", async () => {
    expect(getOutcome(await loadDieHarder(DIE_HARDER_TRACE))).toEqual({
      status: "invariant-violation",
      violation: "NotSolved",
      generated: 37,
      distinct: 7,
    });
  });

  it("loads TLC's trace of MissionariesAndCannibals, finding its model values by index", async () => {
    const directory = "typescript/examples/missionaries-and-cannibals";
    const result = await loadTrace(
      readText(`${directory}/MissionariesAndCannibals.tla`),
      readText(`${directory}/MissionariesAndCannibals.cfg`),
      readFixture("load-trace/MissionariesAndCannibals.bin"),
    );
    expect(getOutcome(result)).toEqual({
      status: "invariant-violation",
      violation: "Solution",
      generated: 63,
      distinct: 12,
    });
  });

  it("loads a trace that tla-ts dumps", async () => {
    const trace = await dumpTrace(
      readText("load-trace/MCDieHarder.tla"),
      readText("load-trace/MCDieHarder.cfg"),
    );
    expect(getOutcome(await loadDieHarder(trace))).toEqual({
      status: "invariant-violation",
      violation: "NotSolved",
      generated: 37,
      distinct: 7,
    });
  });

  it.each([
    ["trailing bytes after the value", gzip([...DIE_HARDER_PAYLOAD, 1, 2, 3])],
    ["bytes after the gzip member", Uint8Array.from([...DIE_HARDER_TRACE, 1, 2, 3])],
    ["a second gzip member", Uint8Array.from([...DIE_HARDER_TRACE, ...gzip([1, 0, 0, 0, 7])])],
    [
      "a file name in the gzip header",
      Uint8Array.from([
        ...withByte(DIE_HARDER_TRACE.subarray(0, 10), 3, 8),
        0x61,
        0,
        ...DIE_HARDER_TRACE.subarray(10),
      ]),
    ],
  ])("loads a trace with %s, as GZIPInputStream does", async (_name, trace) => {
    expect(getOutcome(await loadDieHarder(trace))).toEqual({
      status: "invariant-violation",
      violation: "NotSolved",
      generated: 37,
      distinct: 7,
    });
  });

  it("reads a missing trace as an empty record", async () => {
    const result = await loadDieHarder(undefined);
    expect(result.failure?.message).toBe(
      "Attempted to access nonexistent field 'counterexample' of record\n[]",
    );
  });

  it.each([
    ["a file that isn't gzip", DIE_HARDER_PAYLOAD, "Not in GZIP format"],
    [
      "another compression method",
      withByte(DIE_HARDER_TRACE, 2, 7),
      "Unsupported compression method",
    ],
    [
      "a bad header CRC",
      Uint8Array.from([
        ...withByte(DIE_HARDER_TRACE.subarray(0, 10), 3, 2),
        0x12,
        0x34,
        ...DIE_HARDER_TRACE.subarray(10),
      ]),
      "Corrupt GZIP header",
    ],
    [
      "a bad trailer CRC",
      withByte(
        DIE_HARDER_TRACE,
        DIE_HARDER_TRACE.length - 8,
        DIE_HARDER_TRACE[DIE_HARDER_TRACE.length - 8] ^ 1,
      ),
      "Corrupt GZIP trailer",
    ],
    [
      "cut deflate data",
      DIE_HARDER_TRACE.subarray(0, DIE_HARDER_TRACE.length >> 1),
      "Unexpected end of ZLIB input stream",
    ],
    [
      "a bad deflate block",
      Uint8Array.from([...DIE_HARDER_TRACE.subarray(0, 10), 0xff, 0xff, 0xff, 0xff]),
      "invalid block type",
    ],
    ["an unknown kind", gzip([99]), KIND_99],
    ["an unknown model value", gzip([21, 0x7f, 0]), "Index 32512 out of bounds for length 0"],
    ["a handle past the table", gzip([26, 0, 0x40]), "Index 64 out of bounds for length 16"],
    ["a negative string length", gzip([3, ...Array(8).fill(0), 0xff, 0xff, 0xff, 0xff]), "-1"],
    [
      "a field name as a value",
      gzip([4, 0, 0, 0, 1, ...STRING_A, 26, 0, 1]),
      "class util.UniqueString cannot be cast to class tlc2.value.IValue (util.UniqueString and tlc2.value.IValue are in unnamed module of loader 'app')",
    ],
    [
      "a value as a field name",
      gzip([7, 0, 2, ...STRING_A, 4, 0, 0, 0, 1, 26, 0, 1, 1, 0, 0, 0, 1]),
      "class tlc2.value.impl.StringValue cannot be cast to class util.UniqueString (tlc2.value.impl.StringValue and util.UniqueString are in unnamed module of loader 'app')",
    ],
    ["a bad CRC after 8192 bytes", withBadCrc(8192), "Corrupt GZIP trailer"],
    ["a bad CRC after 8193 bytes", withBadCrc(8193), KIND_99],
    ["a bad deflate block after 8698 bytes", withBadBlock(8698), "invalid block type"],
    ["a bad deflate block after 8699 bytes", withBadBlock(8699), KIND_99],
    [
      "a bad deflate block after 8677 bytes of a second member",
      withBadSecondMember(8677),
      "invalid block type",
    ],
    ["a bad deflate block after 8678 bytes of a second member", withBadSecondMember(8678), KIND_99],
    [
      "a bad deflate block after 12000 bytes inflated from one input buffer",
      withDenseBadBlock(12000),
      "invalid block type",
    ],
  ])("reports %s as TLC does", async (_name, trace, message) => {
    const result = await loadDieHarder(trace);
    expect(result.failure?.message).toBe(getJavaError(message));
  });

  it.each([
    [
      "is cut short",
      "prints an EOFException's stack trace",
      gzip([...DIE_HARDER_PAYLOAD.subarray(0, DIE_HARDER_PAYLOAD.length >> 1)]),
    ],
    [
      "refers to value 5 before it defines that value",
      "fails later with a NullPointerException",
      gzip([26, 0, 5]),
    ],
    [
      "holds a function from 1..5 with 2 values",
      "builds a function whose domain and values disagree",
      gzip([9, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 5, 1, 0, 0, 0, 1, 1, 0, 0, 0, 2]),
    ],
  ])("reports a trace file that %s, where TLC %s", async (problem, _behavior, trace) => {
    const result = await loadDieHarder(trace);
    expect(result.failure?.message).toBe(`The trace file ${TRACE_PATH} ${problem}.`);
  });

  it("reports a string longer than the trace file as cut short, where TLC runs out of memory", async () => {
    const result = await loadDieHarder(
      gzip([3, ...Array(8).fill(0), 0x7f, 0xff, 0xff, 0xff, 0x61]),
    );
    expect(result.failure?.message).toBe(`The trace file ${TRACE_PATH} is cut short.`);
  });

  it.each([
    [
      "a record that repeats a field",
      "prints the record",
      getRecordBytes([
        ["a", getIntegerBytes(1)],
        ["c", getIntegerBytes(1)],
        ["c", getIntegerBytes(1)],
        ["b", getIntegerBytes(1)],
        ["b", getIntegerBytes(1)],
      ]),
      "Field name c occurs multiple times in record.",
    ],
    [
      "a function marked normalized that repeats a key",
      "prints the function",
      getRecordBytes([["f", getFunctionBytes(1, [1, 1])]]),
      "The value\n1\noccurs multiple times in the function domain.",
    ],
    [
      "a function marked unnormalized that repeats a key",
      "reports it only where it first sorts the function",
      getRecordBytes([["f", getFunctionBytes(2, [1, 3, 3, 2, 2])]]),
      "The value\n3\noccurs multiple times in the function domain.",
    ],
  ])("reports %s as it reads the trace, where TLC %s", async (_name, _behavior, bytes, message) => {
    const result = await loadDieHarder(gzip(bytes));
    expect(result.failure?.message).toBe(message);
  });

  const SET_SOURCE =
    "---- MODULE T ----\nVARIABLE x\nInit == x \\in {{1, 2}, {1}, {2}}\nNext == UNCHANGED x\n====";

  const FUNCTION_SOURCE =
    "---- MODULE T ----\nEXTENDS TLC\nVARIABLE x\nInit == x \\in {(1 :> 1 @@ 2 :> 1), (1 :> 1)}\nNext == UNCHANGED x\n====";

  it.each([
    ["a set marked normalized but written out of order", SET_SOURCE, getSetBytes([2, 1]), 5],
    [
      "a set marked normalized but written with a repeated element",
      SET_SOURCE,
      getSetBytes([1, 1]),
      5,
    ],
    [
      "a function marked normalized but written out of order",
      FUNCTION_SOURCE,
      getFunctionBytes(1, [2, 1]),
      4,
    ],
  ])("replays %s, where TLC matches no state", async (_name, source, value, generated) => {
    const result = await loadTrace(source, SINGLE_STATE_CONFIG, getStateTrace(value));
    expect(getOutcome(result)).toEqual({
      status: "success",
      violation: undefined,
      generated,
      distinct: 2,
    });
  });

  it("reads a string's bytes as Latin-1, where TLC sign-extends them", async () => {
    const result = await loadDieHarder(
      gzip([4, 0, 0, 0, 1, ...STRING_A, ...STRING_A.slice(0, -1), 0xe9]),
    );
    expect(result.failure?.message).toBe(
      "Attempted to access nonexistent field 'counterexample' of record\n[a |-> \"é\"]",
    );
  });

  const getLatinSource = (initial: string) =>
    `---- MODULE L ----\nEXTENDS Naturals, Sequences\nVARIABLE x\nInit == x = "${initial}"\nNext == x' = x \\o "a"\nInv == Len(x) < 4\n====`;

  const LATIN_CONFIG = "INIT Init\nNEXT Next\nINVARIANT Inv";

  it.each([
    ["é", { status: "invariant-violation", violation: "Inv", generated: 4, distinct: 4 }],
    ["€", { status: "success", violation: undefined, generated: 1, distinct: 0 }],
  ])(
    "loads a dumped trace whose string holds %s, which keeps only each character's low byte",
    async (initial, outcome) => {
      const source = getLatinSource(initial);
      const trace = await dumpTrace(source, LATIN_CONFIG);
      expect(getOutcome(await loadTrace(source, LATIN_CONFIG, trace))).toEqual(outcome);
    },
  );

  it.each([
    [5000, "as TLC does"],
    [10000, "where TLC overflows its stack"],
  ])("loads a trace that nests %i tuples once, %s", async (depth) => {
    let reads = 0;
    const result = await loadTrace(
      SINGLE_STATE_SOURCE,
      SINGLE_STATE_CONFIG,
      getNestedTrace(depth),
      "_TLCTrace",
      () => reads++,
    );
    expect({ outcome: getOutcome(result), reads }).toEqual({
      outcome: { status: "success", violation: undefined, generated: 2, distinct: 1 },
      reads: 1,
    });
  });
});

const getStringLocation = (payload: Uint8Array, text: string) => {
  const pattern = [
    0,
    0,
    0,
    text.length,
    ...Array.from(text, (character) => character.charCodeAt(0)),
  ];
  const start = payload.findIndex((_byte, index) =>
    pattern.every((byte, offset) => payload[index + offset] === byte),
  );
  return new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getInt32(start - 4);
};

describe("-dumpTrace tlc writes each string's location as TLC does", () => {
  it.each([
    [
      "load-trace/MCDieHarder",
      "load-trace/MCDieHarder.bin",
      ["contents", "vars", "counterexample"],
    ],
    [
      "typescript/examples/missionaries-and-cannibals/MissionariesAndCannibals",
      "load-trace/MissionariesAndCannibals.bin",
      ["bank_of_boat", "who_is_on_bank", "vars", "counterexample"],
    ],
  ])(
    "gives each root variable of %s its index, and any other string -1",
    async (spec, tlcTrace, texts) => {
      const trace = await dumpTrace(readText(`${spec}.tla`), readText(`${spec}.cfg`));
      if (trace === undefined) throw new Error("expected a trace");
      const tlcPayload = gunzipSync(readFixture(tlcTrace));
      expect(texts.map((text) => getStringLocation(gunzipSync(trace), text))).toEqual(
        texts.map((text) => getStringLocation(tlcPayload, text)),
      );
    },
  );
});

describe("-loadTrace's _TLCState matches TLC", () => {
  const LONG_SOURCE =
    "---- MODULE Long ----\nEXTENDS Naturals\nVARIABLE x\nInit == x = 0\nNext == x' = x + 1\nInv == x < 300\n====";

  const LONG_CONFIG = "INIT Init\nNEXT Next\nINVARIANT Inv";

  it.each<TraceModule>(["_TLCTrace", "_JsonTrace"])(
    "reads the current state in %s instead of rebuilding the trace to it",
    async (module) => {
      const trace = await dumpTrace(LONG_SOURCE, LONG_CONFIG, module);
      expect(getOutcome(await loadTrace(LONG_SOURCE, LONG_CONFIG, trace, module))).toEqual({
        status: "invariant-violation",
        violation: "Inv",
        generated: 301,
        distinct: 301,
      });
    },
  );
});
