(*---
description: LAMBDA with two parameters is accepted where arity 2 is required.
ref: "tla2sany/semantic/Generator.java#generateLambda"
features: [operators]
flags: [expression]
outcome: success
---*)
---- MODULE lambda_two_params ----
Op(F(_,_)) == F(1, 2)
Test == Op(LAMBDA a, b : a) = 1
====

(*--- recorded
all:
  exit: 0
---*)
