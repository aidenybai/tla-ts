(*---
description: 4202 fires for a variable named FALSE.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_variable ----
VARIABLE FALSE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 10 to line 8, col 14 of module builtin_as_variable
    | Symbol FALSE is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
