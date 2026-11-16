(*---
description: 4202 fires for a parameter named TRUE.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_parameter ----
A(TRUE) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 3 to line 8, col 6 of module builtin_as_parameter
    | Symbol TRUE is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
