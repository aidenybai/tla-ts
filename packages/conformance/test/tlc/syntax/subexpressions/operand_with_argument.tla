(*---
description: "An operator's argument comes before the selector, and is substituted in the subexpression."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE operand_with_argument ----
EXTENDS Naturals
Op(x) == 1 + (2 * x)
Test == Op(5)!2 = 10 /\ Op(5)!2!2 = 5
====

(*--- recorded
all:
  exit: 0
---*)
