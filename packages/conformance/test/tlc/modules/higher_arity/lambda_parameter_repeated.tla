(*---
description: A LAMBDA parameter may not repeat.
ref: "tla2sany/semantic/Generator.java#generateLambda"
features: [higher_arity]
outcome: parse-error
---*)
---- MODULE lambda_parameter_repeated ----
Op(F(_, _)) == F(1, 2)
Test == Op(LAMBDA a, a : 1)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 9, col 22 to line 9, col 22 of module lambda_parameter_repeated
    | Multiply-defined symbol 'a': this definition or declaration conflicts 
    | with the one at line 9, col 19 to line 9, col 19 of module lambda_parameter_repeated.
    3002:1 Parsing or semantic analysis failed.
---*)
