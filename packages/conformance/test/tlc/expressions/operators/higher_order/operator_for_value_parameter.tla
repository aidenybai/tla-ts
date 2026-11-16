(*---
description: "Passing an operator with arguments for an ordinary parameter is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE operator_for_value_parameter ----
EXTENDS Integers
F(a) == a
Inc(x) == x
Test == F(Inc) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 11 to line 11, col 13 of module operator_for_value_parameter
    | The operator Inc requires 1 arguments.
    3002:1 Parsing or semantic analysis failed.
---*)
