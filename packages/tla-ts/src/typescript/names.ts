// TLA+ keywords, the operators of the modules every spec extends, and the names tla-ts
// generates. A TypeScript name that collides with one of these gets a suffix.
const RESERVED = new Set([
  "ACTION",
  "ASSUME",
  "ASSUMPTION",
  "AXIOM",
  "BOOLEAN",
  "BY",
  "CASE",
  "CHOOSE",
  "CONSTANT",
  "CONSTANTS",
  "COROLLARY",
  "DEF",
  "DEFINE",
  "DEFS",
  "DOMAIN",
  "ELSE",
  "ENABLED",
  "EXCEPT",
  "EXTENDS",
  "FALSE",
  "HAVE",
  "HIDE",
  "IF",
  "IN",
  "INSTANCE",
  "LAMBDA",
  "LEMMA",
  "LET",
  "LOCAL",
  "MODULE",
  "NEW",
  "OBVIOUS",
  "OMITTED",
  "ONLY",
  "OTHER",
  "PICK",
  "PROOF",
  "PROPOSITION",
  "PROVE",
  "QED",
  "RECURSIVE",
  "SF_",
  "STATE",
  "STRING",
  "SUBSET",
  "SUFFICES",
  "TAKE",
  "TEMPORAL",
  "THEN",
  "THEOREM",
  "TRUE",
  "UNCHANGED",
  "UNION",
  "USE",
  "VARIABLE",
  "VARIABLES",
  "WF_",
  "WITH",
  "WITNESS",
  "Nat",
  "Int",
  "Seq",
  "Len",
  "Append",
  "Head",
  "Tail",
  "SubSeq",
  "SelectSeq",
  "Cardinality",
  "IsFiniteSet",
  "Print",
  "PrintT",
  "Assert",
  "JavaTime",
  "TLCGet",
  "TLCSet",
  "Permutations",
  "SortSeq",
  "RandomElement",
  "Any",
  "ToString",
  "TLCEval",
  "Init",
  "Next",
  "Spec",
  "vars",
  "Ref",
  "BuiltIns",
  "UsedBuiltIns",
  "Null",
  "Undefined",
  "Perms",
  "Rem",
  "Quot",
]);

export interface Names {
  getFresh: (base: string) => string;
}

export const createNames = (): Names => {
  const used = new Set<string>();
  // The next index to try for each name, so that many names that sanitize alike stay quick.
  const nextIndices = new Map<string, number>();
  return {
    getFresh: (base) => {
      const sanitized = base.replace(/[^A-Za-z0-9_]/g, "_");
      const name = /[A-Za-z]/.test(sanitized) ? sanitized : `v${sanitized}`;
      const getIndex = (index: number): number => {
        const candidate = index === 0 ? name : `${name}_${index}`;
        return used.has(candidate) || RESERVED.has(candidate) ? getIndex(index + 1) : index;
      };
      const index = getIndex(nextIndices.get(name) ?? 0);
      const fresh = index === 0 ? name : `${name}_${index}`;
      nextIndices.set(name, index + 1);
      used.add(fresh);
      return fresh;
    },
  };
};
