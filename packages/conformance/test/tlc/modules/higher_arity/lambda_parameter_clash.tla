(*---
description: A LAMBDA parameter may not reuse a defined name.
ref: "tla2sany/semantic/Generator.java#generateLambda"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE lambda_parameter_clash ----
A == 1
Op(F(_)) == F(1)
Test == Op(LAMBDA A : 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 19 to line 10, col 19 of module lambda_parameter_clash
    | Multiply-defined symbol 'A': this definition or declaration conflicts 
    | with the one at line 8, col 1 to line 8, col 6 of module lambda_parameter_clash.
    3002:1 Parsing or semantic analysis failed.
---*)
