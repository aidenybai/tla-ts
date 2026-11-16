(*---
description: "Number selectors count bound groups, not names."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_bound_groups ----
Op == \A x, y \in {1}, z \in {2} : TRUE
Test == Op!1 = {1} /\ Op!2 = {2}
====

(*--- recorded
all:
  exit: 0
---*)
