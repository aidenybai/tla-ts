(*---
description: A label parameter is replaced by the selector argument.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [labels]
flags: [expression]
outcome: success
---*)
---- MODULE parameter_binds_argument ----
Op == \A x \in {1} : l(x):: x = 1
Test == Op!l(1) /\ ~Op!l(2)
====

(*--- recorded
all:
  exit: 0
---*)
