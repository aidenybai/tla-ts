(*---
description: "- passed where arity 1 is expected is still infix minus, so its arity is wrong; only -. means the prefix."
ref: "tla2sany/semantic/Generator.java#generateExprOrOpArg"
features: [operators]
outcome: parse-error
---*)
---- MODULE arg_minus_unary_rejected ----
EXTENDS Integers
Op(F(_), a) == F(a)
Test == Op(-, 1) = 0 - 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 10, col 9 to line 10, col 10 of module arg_minus_unary_rejected
    | Operator with incorrect arity passed as argument. 
    | Operator '-' of arity 2 is argument number 1 (counting from 1) to operator `line 9, col 1 to line 9, col 19 of module arg_minus_unary_rejected', 
    | but an operator of arity 1 was expected.
    | line 10, col 9 to line 10, col 16 of module arg_minus_unary_rejected
    | Argument number 1 to operator 'Op' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
