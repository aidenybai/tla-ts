(*---
description: Operand selectors may follow a label name.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE label_operands_after_name ----
EXTENDS Naturals
Op == l:: 1 + 2
Test == Op!l!1 = 1 /\ Op!l!2 = 2 /\ Op!l!<< = 1 /\ Op!l!>> = 2
====

(*--- recorded
all:
  exit: 0
---*)
