(*---
description: "/= is built in, so defining it is a redefinition error."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [operators]
outcome: parse-error
---*)
---- MODULE infix_redefine_neq ----
a /= b == a
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 11 of module infix_redefine_neq
    | Operator /= already defined or declared.
    | line 8, col 1 to line 8, col 11 of module infix_redefine_neq
    | Symbol /= is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
