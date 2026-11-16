(*---
description: "A RECURSIVE declaration of another arity than the definition is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE declared_wrong_arity ----
EXTENDS Integers
RECURSIVE F(_, _)
F(n) == n
Test == F(1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 1 to line 10, col 9 of module declared_wrong_arity
    | Definition of F has different arity than its RECURSIVE declaration.
    | line 11, col 10 to line 11, col 12 of module declared_wrong_arity
    | The operator F requires 2 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
