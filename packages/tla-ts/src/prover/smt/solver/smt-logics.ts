// Ported from Z3 (src/solver/smt_logics.cpp), MIT license, see z3-license.txt.
const isAllLogic = (logic: string) => logic === "ALL" || logic === "HO_ALL";

const isFfLogic = (logic: string) => logic === "QF_FF" || logic === "QF_FFA";

const ARITH_PARTS = ["LRA", "LIRA", "LIA", "NRA", "NTA", "NIRA", "NIA", "IDL", "RDL"];

const REALS_ONLY_PARTS = ["LRA", "NRA", "NTA", "RDL"];

export const logicHasRealsOnly = (logic: string) =>
  REALS_ONLY_PARTS.some((part) => logic.includes(part));

export const logicHasFpa = (logic: string) => logic.includes("FP") || isAllLogic(logic);

export const logicHasArith = (logic: string) =>
  ARITH_PARTS.some((part) => logic.includes(part)) ||
  logic === "QF_BVRE" ||
  logicHasFpa(logic) ||
  logic === "QF_S" ||
  isAllLogic(logic) ||
  logic === "QF_FD" ||
  logic === "HORN";

export const logicHasBv = (logic: string) =>
  logic.includes("BV") ||
  logic === "FP" ||
  isAllLogic(logic) ||
  logic === "QF_FD" ||
  logic === "SMTFD" ||
  logic === "HORN";

export const logicHasArray = (logic: string) =>
  logic.startsWith("QF_A") ||
  logic.startsWith("A") ||
  isAllLogic(logic) ||
  logic === "SMTFD" ||
  logic === "HORN";

const logicHasStr = (logic: string) =>
  logic === "QF_S" || logic === "QF_SLIA" || logic === "QF_SNIA" || isAllLogic(logic);

export const logicHasSeq = (logic: string) => logic === "QF_BVRE" || logicHasStr(logic);

const logicHasUf = (logic: string) => logic.includes("UF") || logic === "SMTFD";

const logicHasDatatype = (logic: string) =>
  logic.includes("DT") || logic === "QF_FD" || isAllLogic(logic) || logic === "HORN";

const logicHasFiniteSets = (logic: string) => logic.includes("FS") || isAllLogic(logic);

export const isSupportedLogic = (logic: string) =>
  isFfLogic(logic) ||
  isAllLogic(logic) ||
  logicHasUf(logic) ||
  logic === "QF_FD" ||
  logicHasArith(logic) ||
  logicHasBv(logic) ||
  logicHasArray(logic) ||
  logicHasSeq(logic) ||
  logicHasStr(logic) ||
  logic === "HORN" ||
  logicHasFpa(logic) ||
  logicHasDatatype(logic) ||
  logicHasFiniteSets(logic);
