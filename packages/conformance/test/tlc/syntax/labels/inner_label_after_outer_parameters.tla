(*---
description: "An inner label's parameters count from the enclosing label's scope."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE inner_label_after_outer_parameters ----
EXTENDS Naturals
Op == \A x \in {1} : a(x):: \A y \in {2} : b(y):: x + y = 3
Test == Op!a(1)!b(2)
====

(*--- recorded
all:
  exit: 0
---*)
