(*---
description: Elements of a set enumeration are operands.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE set_enumeration_operands ----
Op == {1, 2, 3}
Test == Op!2 = 2
====

(*--- recorded
all:
  exit: 0
---*)
