(*---
description: "Passing a number for an operator parameter is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE number_for_operator_parameter ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == Apply(3, 1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 15 to line 10, col 15 of module number_for_operator_parameter
    | An expression appears as argument number 1 (counting from 1) to operator 'Apply', in a position an operator is required.
    | line 10, col 9 to line 10, col 19 of module number_for_operator_parameter
    | Argument number 1 to operator 'Apply' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
