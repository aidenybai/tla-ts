(*---
description: 4202 fires for a LET name TRUE.
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_let ----
A == LET TRUE == 1 IN 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 10 to line 8, col 18 of module builtin_as_let
    | Operator TRUE already defined or declared.
    | line 8, col 10 to line 8, col 18 of module builtin_as_let
    | Symbol TRUE is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
