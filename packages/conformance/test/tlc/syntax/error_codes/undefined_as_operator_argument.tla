(*---
description: 4200 fires for an operator argument name.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE undefined_as_operator_argument ----
Ap(F(_)) == F(1)
A == Ap(Missing)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 9, col 9 to line 9, col 15 of module undefined_as_operator_argument
    | Unknown operator: `Missing'.
    | line 9, col 6 to line 9, col 16 of module undefined_as_operator_argument
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
