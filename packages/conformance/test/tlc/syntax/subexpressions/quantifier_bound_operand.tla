(*---
description: A number selector on a bounded quantifier picks a bound set.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_bound_operand ----
Op == \A x \in {1} : x = 1
Test == Op!1 = {1}
====

(*--- recorded
all:
  exit: 0
---*)
