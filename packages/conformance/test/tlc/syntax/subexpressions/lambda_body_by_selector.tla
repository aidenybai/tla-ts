(*---
description: "A LAMBDA argument's body is !(e)."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE lambda_body_by_selector ----
Ap(F(_), x) == F(x)
Op == Ap(LAMBDA x : x = 1, 1)
Test == Op!1!(1) /\ Op!2 = 1
====

(*--- recorded
all:
  exit: 0
---*)
