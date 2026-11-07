(*---
description: A LAMBDA may use names from its surroundings.
ref: "tla2sany/semantic/Generator.java#generateLambda"
features: [higher_arity]
flags: [expression]
outcome: success
---*)
---- MODULE lambda_capturing_bound_name ----
Op(F(_)) == F(1)
Test == \A x \in {5} : Op(LAMBDA a : <<a, x>>) = <<1, 5>>
====

(*--- recorded
all:
  exit: 0
---*)
