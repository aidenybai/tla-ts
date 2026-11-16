(*---
description: 4202 fires for a bound name BOOLEAN.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_bound ----
A == \A BOOLEAN \in {1} : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 8, col 9 to line 8, col 15 of module builtin_as_bound
    | Symbol BOOLEAN is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
