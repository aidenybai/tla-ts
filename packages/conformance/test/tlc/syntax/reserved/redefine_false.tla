(*---
description: "FALSE is a built-in symbol, so its definition is a semantic error rather than a parse error."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [reserved]
outcome: parse-error
---*)
---- MODULE redefine_false ----
FALSE == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 10 of module redefine_false
    | Operator FALSE already defined or declared.
    | line 8, col 1 to line 8, col 10 of module redefine_false
    | Symbol FALSE is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
