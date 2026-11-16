(*---
description: "4201 fires for a function reusing an operator's name."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE redefined_function_vs_operator ----
A == 1
A[x \in {1}] == x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 1 to line 9, col 17 of module redefined_function_vs_operator
    | Function name `A' already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
