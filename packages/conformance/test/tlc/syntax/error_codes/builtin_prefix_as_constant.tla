(*---
description: 4202 fires for a constant spelled SUBSET.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_prefix_as_constant ----
CONSTANT SUBSET _
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 17 of module builtin_prefix_as_constant
    | Symbol SUBSET is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
