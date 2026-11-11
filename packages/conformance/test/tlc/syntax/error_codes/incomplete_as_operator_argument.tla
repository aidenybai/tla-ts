(*---
description: 4203 or 4204 fires for an instance name passed as an operator.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE incomplete_as_operator_argument ----
---- MODULE I ----
A == 1
====
M == INSTANCE I
Ap(F(_)) == F(1)
Test == Ap(M)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 13, col 12 to line 13, col 12 of module incomplete_as_operator_argument
    | Operator name M is incomplete.
    | line 13, col 9 to line 13, col 13 of module incomplete_as_operator_argument
    | Argument number 1 to operator 'Ap' 
    | should be a 1-parameter operator.
    3002:1 Parsing or semantic analysis failed.
---*)
