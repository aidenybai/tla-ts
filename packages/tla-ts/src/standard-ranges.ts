import type { SourceRange } from "./ast";

// Where the modules in TLC's tla2sany/StandardModules define the operators that tla-ts implements
// natively, which SANY reports when a spec defines one of them again.
const RANGES: Record<string, Record<string, [number, number, number, number]>> = {
  Naturals: {
    Nat: [14, 1, 14, 16],
    "+": [15, 1, 15, 19],
    "-": [17, 1, 17, 33],
    "*": [18, 1, 18, 17],
    "^": [19, 1, 19, 19],
    "<": [20, 1, 20, 19],
    ">": [21, 1, 21, 19],
    "<=": [22, 1, 22, 19],
    ">=": [23, 1, 23, 19],
    "%": [33, 1, 33, 20],
    "\\div": [34, 1, 34, 20],
    "..": [35, 1, 35, 20],
  },
  Integers: {
    Int: [18, 1, 18, 12],
    "-.": [22, 1, 22, 13],
  },
  Sequences: {
    Seq: [20, 1, 20, 41],
    Len: [25, 1, 25, 44],
    "\\o": [30, 1, 31, 76],
    Append: [36, 1, 36, 26],
    Head: [41, 1, 41, 15],
    Tail: [42, 1, 42, 61],
    SubSeq: [48, 1, 48, 50],
    SelectSeq: [53, 1, 65, 14],
  },
  FiniteSets: {
    IsFiniteSet: [14, 1, 19, 68],
    Cardinality: [21, 1, 27, 11],
  },
  Bags: {
    IsABag: [20, 1, 24, 41],
    BagToSet: [26, 1, 26, 23],
    SetToBag: [31, 1, 31, 30],
    BagIn: [36, 1, 36, 31],
    EmptyBag: [41, 1, 41, 24],
    "\\oplus": [43, 1, 49, 46],
    "\\ominus": [51, 1, 60, 50],
    BagUnion: [74, 1, 79, 58],
    "\\sqsubseteq": [81, 1, 87, 42],
    SubBag: [89, 1, 110, 11],
    BagOfAll: [122, 1, 130, 66],
    BagCardinality: [132, 1, 138, 8],
    CopiesIn: [140, 1, 145, 33],
  },
  TLC: {
    Print: [17, 1, 17, 22],
    PrintT: [18, 1, 18, 19],
    Assert: [24, 1, 25, 54],
    JavaTime: [26, 1, 26, 32],
    TLCGet: [75, 1, 75, 28],
    TLCSet: [76, 1, 76, 20],
    ":>": [78, 1, 78, 27],
    "@@": [79, 1, 80, 50],
    Permutations: [81, 1, 82, 54],
    SortSeq: [88, 1, 92, 40],
    RandomElement: [110, 1, 110, 41],
    Any: [119, 1, 119, 22],
    ToString: [121, 1, 121, 58],
    TLCEval: [145, 1, 145, 15],
  },
  TLCExt: {
    AssertEq: [14, 1, 20, 14],
    AssertError: [23, 1, 26, 72],
    TLCGetOrDefault: [30, 1, 31, 17],
    TLCGetAndSet: [33, 1, 35, 57],
    Trace: [41, 1, 57, 6],
    CounterExample: [61, 1, 75, 8],
    ToTrace: [77, 1, 87, 12],
    TLCModelValue: [91, 1, 120, 29],
    TLCDefer: [122, 1, 134, 6],
    TLCNoOp: [138, 1, 145, 5],
    PickSuccessor: [148, 1, 162, 37],
    TLCCache: [166, 1, 173, 12],
    TLCFP: [175, 1, 181, 24],
    TLCEvalDefinition: [185, 1, 190, 6],
  },
  Randomization: {
    RandomSubset: [30, 1, 30, 64],
    RandomSetOfSubsets: [48, 1, 49, 67],
    TestRandomSetOfSubsets: [61, 1, 62, 71],
  },
  Json: {
    ToJson: [46, 1, 55, 37],
    ToJsonArray: [57, 1, 64, 42],
    ToJsonObject: [66, 1, 73, 43],
    JsonSerialize: [75, 1, 80, 6],
    JsonDeserialize: [82, 1, 87, 19],
    ndJsonSerialize: [89, 1, 95, 6],
    ndJsonDeserialize: [97, 1, 103, 19],
  },
  _Possible: {
    _Track: [10, 1, 17, 38],
    _Counts: [24, 1, 30, 14],
    _CheckName: [32, 1, 35, 35],
    _PrintCounts: [37, 1, 37, 31],
  },
};

export const getStandardRange = (module: string, name: string): SourceRange | undefined => {
  const range = RANGES[module]?.[name];
  return (
    range && {
      module,
      start: { line: range[0], column: range[1] },
      end: { line: range[2], column: range[3] },
    }
  );
};
