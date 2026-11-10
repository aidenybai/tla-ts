(*---
description: "Label parameters may be listed in any order, and selector arguments follow that order."
ref: "tla2sany/semantic/Generator.java#formalParamsEqual"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_order_is_label_order ----
Op == \A x \in {1}, y \in {2} : l(y, x):: x = 1 /\ y = 2
Test == Op!l(2, 1) /\ ~Op!l(1, 2)
====

(*--- recorded
all:
  exit: 0
---*)
