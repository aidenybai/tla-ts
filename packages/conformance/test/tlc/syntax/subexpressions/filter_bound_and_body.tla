(*---
description: "A set filter's bound is !1 and its predicate is !(e)."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE filter_bound_and_body ----
Op == {x \in {1} : x = 1}
Test == Op!1 = {1} /\ Op!(1)
====

(*--- recorded
all:
  exit: 0
---*)
