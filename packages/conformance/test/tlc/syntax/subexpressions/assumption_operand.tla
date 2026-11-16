(*---
description: "A named assumption's body has operands."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE assumption_operand ----
ASSUME A == 1 = 2 \/ 1 = 1
Test == A /\ ~A!1
====

(*--- recorded
all:
  exit: 0
---*)
