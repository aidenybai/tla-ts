(*---
description: 4202 fires for a function named TRUE.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_function ----
TRUE[x \in {1}] == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 1 to line 8, col 20 of module builtin_as_function
    | Function name `TRUE' already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
