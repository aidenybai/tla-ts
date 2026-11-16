(*---
description: A LAMBDA that primes its parameter cannot take a primed argument.
ref: "tla2sany/semantic/Generator.java#generateOpArg"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE higher_level_lambda_primes_primed ----
VARIABLE v
Ap(F(_)) == F(v')
A == Ap(LAMBDA x : x')
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 6 to line 10, col 22 of module higher_level_lambda_primes_primed
    | Level error in applying operator Ap:
    | The permitted level of argument 1 of the operator argument 1 
    | must be at least 2.
    3002:1 Parsing or semantic analysis failed.
---*)
