(*---
description: Selectors compose down the tree.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE nested_operands ----
EXTENDS Naturals
Op == 1 + (2 * 3)
Test == Op!2!2 = 3 /\ Op!2!<< = 2
====

(*--- recorded
all:
  exit: 0
---*)
