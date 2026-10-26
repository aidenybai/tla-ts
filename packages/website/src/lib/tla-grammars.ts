import type { LanguageRegistration } from "shiki";

const IDENTIFIER = "[A-Za-z_][A-Za-z0-9_]*";

export const TLA_GRAMMAR: LanguageRegistration = {
  name: "tlaplus",
  displayName: "TLA+",
  scopeName: "source.tlaplus",
  aliases: ["tla"],
  patterns: [
    { include: "#comments" },
    { include: "#module" },
    { include: "#definition" },
    { include: "#strings" },
    { include: "#numbers" },
    { include: "#keywords" },
    { include: "#operators" },
  ],
  repository: {
    comments: {
      patterns: [
        { name: "comment.line.tlaplus", match: "\\\\\\*.*$" },
        {
          name: "comment.block.tlaplus",
          begin: "\\(\\*",
          end: "\\*\\)",
          patterns: [{ include: "#comments" }],
        },
      ],
    },
    module: {
      patterns: [
        {
          match: `^(-{4,})\\s*(MODULE)\\s+(${IDENTIFIER})\\s*(-{4,})`,
          captures: {
            1: { name: "punctuation.definition.module.tlaplus" },
            2: { name: "keyword.other.module.tlaplus" },
            3: { name: "entity.name.type.module.tlaplus" },
            4: { name: "punctuation.definition.module.tlaplus" },
          },
        },
        { name: "punctuation.separator.tlaplus", match: "^(-{4,}|={4,})\\s*$" },
      ],
    },
    definition: {
      match: `^(?:(LOCAL)\\s+)?(${IDENTIFIER})(?=\\s*(?:\\([^)]*\\)|\\[[^\\]]*\\])?\\s*==)`,
      captures: {
        1: { name: "storage.modifier.tlaplus" },
        2: { name: "entity.name.function.tlaplus" },
      },
    },
    strings: {
      name: "string.quoted.double.tlaplus",
      begin: '"',
      end: '"',
      patterns: [{ name: "constant.character.escape.tlaplus", match: "\\\\." }],
    },
    numbers: { name: "constant.numeric.tlaplus", match: "\\b\\d+\\b" },
    keywords: {
      patterns: [
        {
          name: "keyword.other.tlaplus",
          match:
            "\\b(EXTENDS|CONSTANTS?|VARIABLES?|ASSUME|ASSUMPTION|AXIOM|THEOREM|LEMMA|COROLLARY|PROPOSITION|INSTANCE|WITH|RECURSIVE|PROOF|BY|QED|DEF|DEFS|OBVIOUS|OMITTED)\\b",
        },
        { name: "storage.modifier.tlaplus", match: "\\bLOCAL\\b" },
        {
          name: "keyword.control.tlaplus",
          match: "\\b(IF|THEN|ELSE|CASE|OTHER|LET|IN|CHOOSE|EXCEPT|LAMBDA)\\b",
        },
        {
          name: "support.function.tlaplus",
          match: "\\b(UNCHANGED|ENABLED|SUBSET|UNION|DOMAIN|WF_|SF_)",
        },
        { name: "constant.language.tlaplus", match: "\\b(TRUE|FALSE|BOOLEAN|STRING|Nat|Int)\\b" },
      ],
    },
    operators: {
      patterns: [
        { name: "keyword.operator.quantifier.tlaplus", match: "\\\\(A|E|AA|EE|forall|exists)\\b" },
        { name: "keyword.operator.word.tlaplus", match: "\\\\[A-Za-z]+" },
        {
          name: "keyword.operator.tlaplus",
          match:
            "/\\\\|\\\\/|<=>|=>|==|\\|->|->|<-|\\[\\]|<>|~>|\\.\\.|:>|@@|/=|<=|>=|=<|[=#<>~'+\\-*%^@!]",
        },
      ],
    },
  },
};

export const TLC_CONFIG_GRAMMAR: LanguageRegistration = {
  name: "tlaplus-config",
  displayName: "TLC configuration",
  scopeName: "source.tlaplus.config",
  patterns: [
    { name: "comment.line.tlaplus", match: "\\\\\\*.*$" },
    { name: "comment.block.tlaplus", begin: "\\(\\*", end: "\\*\\)" },
    {
      name: "keyword.other.tlaplus",
      match:
        "\\b(SPECIFICATION|INIT|NEXT|INVARIANTS?|PROPERTY|PROPERTIES|CONSTANTS?|CONSTRAINTS?|ACTION_CONSTRAINTS?|SYMMETRY|VIEW|ALIAS|POSTCONDITIONS?|CHECK_DEADLOCK)\\b",
    },
    { name: "constant.language.tlaplus", match: "\\b(TRUE|FALSE)\\b" },
    { name: "string.quoted.double.tlaplus", begin: '"', end: '"' },
    { name: "constant.numeric.tlaplus", match: "-?\\b\\d+\\b" },
    { name: "keyword.operator.tlaplus", match: "<-|=" },
    { name: "variable.other.tlaplus", match: IDENTIFIER },
  ],
  repository: {},
};
