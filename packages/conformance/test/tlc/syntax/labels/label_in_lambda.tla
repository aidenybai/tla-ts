(*---
description: "A LAMBDA's parameters are label parameters."
ref: "tla2sany/semantic/Generator.java#generateLambda"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_in_lambda ----
Ap(F(_)) == F(1)
Test == Ap(LAMBDA x : l(x):: x = 1)
====

(*--- recorded
all:
  exit: 0
---*)
