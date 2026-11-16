(*---
description: "BOOLEAN is a built-in symbol, so its definition is a semantic error rather than a parse error."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [reserved]
outcome: parse-error
---*)
---- MODULE redefine_boolean ----
BOOLEAN == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 12 of module redefine_boolean
    | Operator BOOLEAN already defined or declared.
    | line 8, col 1 to line 8, col 12 of module redefine_boolean
    | Symbol BOOLEAN is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
