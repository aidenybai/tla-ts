(*---
description: A selected operator argument may be passed as an operator argument.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE operator_argument_passed_on ----
Ap(F(_), x) == F(x)
Op == Ap(LAMBDA x : x = 1, 1)
Test == Ap(Op!1, 1)
====

(*--- recorded
all:
  exit: 0
---*)
