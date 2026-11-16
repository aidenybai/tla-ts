(*---
description: "A bound cannot refer to a variable of the same quantifier."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE same_quantifier_bound_cannot_use_earlier_variable ----
EXTENDS Integers
Test == \E x \in 1..2, y \in 1..x : TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 33 to line 9, col 33 of module same_quantifier_bound_cannot_use_earlier_variable
    | Unknown operator: `x'.
    3002:1 Parsing or semantic analysis failed.
---*)
