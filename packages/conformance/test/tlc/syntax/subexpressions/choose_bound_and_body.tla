(*---
description: "A CHOOSE's bound is !1 and its predicate is !(e)."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE choose_bound_and_body ----
Op == CHOOSE x \in {1} : x = 1
Test == Op!1 = {1} /\ Op!(1) /\ ~Op!(2)
====

(*--- recorded
all:
  exit: 0
---*)
