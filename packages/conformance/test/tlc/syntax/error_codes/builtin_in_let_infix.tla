(*---
description: "4202 fires for a LET definition of \\cap."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_in_let_infix ----
A == LET a \cap b == 1 IN 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 10 to line 8, col 22 of module builtin_in_let_infix
    | Operator \intersect already defined or declared.
    | line 8, col 10 to line 8, col 22 of module builtin_in_let_infix
    | Symbol \intersect is a built-in operator, and cannot be redefined.
    3002:1 Parsing or semantic analysis failed.
---*)
