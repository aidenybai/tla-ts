(*---
description: "STRING is a built-in symbol, so its definition is a semantic error rather than a parse error."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [reserved]
outcome: parse-error
---*)
---- MODULE redefine_string ----
STRING == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 1 to line 8, col 11 of module redefine_string
    | Operator STRING already defined or declared.
    | line 8, col 1 to line 8, col 11 of module redefine_string
    | Symbol STRING is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
