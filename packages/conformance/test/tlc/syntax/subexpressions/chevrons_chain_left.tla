(*---
description: "Infix chains nest to the left, so !<<!<< walks to the first operand."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE chevrons_chain_left ----
Op == 1 = 1 /\ 2 = 2
Test == Op!<<!<< = 1
====

(*--- recorded
all:
  exit: 0
---*)
