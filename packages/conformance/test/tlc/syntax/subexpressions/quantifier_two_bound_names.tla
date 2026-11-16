(*---
description: "!(a, b) gives one argument per bound name."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_two_bound_names ----
Op == \A x, y \in {1} : x = y
Test == Op!(2, 2) /\ ~Op!(1, 2)
====

(*--- recorded
all:
  exit: 0
---*)
