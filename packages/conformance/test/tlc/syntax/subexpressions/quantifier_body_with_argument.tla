(*---
description: "!(e) picks a quantifier's body with e for the bound name."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_body_with_argument ----
Op == \A x \in {1} : x = 2
Test == Op!(2) /\ ~Op!(1)
====

(*--- recorded
all:
  exit: 0
---*)
