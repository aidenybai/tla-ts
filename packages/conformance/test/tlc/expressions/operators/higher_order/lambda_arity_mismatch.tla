(*---
description: "Passing a LAMBDA of the wrong arity is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE lambda_arity_mismatch ----
EXTENDS Integers
Apply(f(_), a) == f(a)
Test == Apply(LAMBDA x, y : x, 1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 9 to line 10, col 13 of module lambda_arity_mismatch
    | Lambda expression with arity 2 used as argument 1 of operator `Apply', 
    | but an operator of arity 1 is required.
    | line 10, col 9 to line 10, col 33 of module lambda_arity_mismatch
    | Argument number 1 to operator 'Apply' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
