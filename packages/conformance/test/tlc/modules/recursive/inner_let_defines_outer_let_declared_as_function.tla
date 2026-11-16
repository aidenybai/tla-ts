(*---
description: "A LET's RECURSIVE function name defined in a deeper LET is at the wrong level."
ref: "tla2sany/semantic/Generator.java#processFunction"
features: [recursive]
outcome: parse-error
---*)
---- MODULE inner_let_defines_outer_let_declared_as_function ----
A == LET RECURSIVE F
         B == LET F[x \in {1}] == x IN 1
         F == 1
     IN B
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 19 to line 9, col 35 of module inner_let_defines_outer_let_declared_as_function
    | Recursive function F defined at wrong LET/IN level.
    | line 9, col 35 to line 9, col 35 of module inner_let_defines_outer_let_declared_as_function
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
