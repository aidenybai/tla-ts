(*---
description: "A named theorem's body has operands."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE theorem_operand ----
THEOREM T == 1 = 1
Test == T /\ T!1 = 1
====

(*--- recorded
all:
  exit: 0
---*)
