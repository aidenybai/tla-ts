(*---
description: "!@ picks a quantifier body as an operator argument of the right arity."
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE quantifier_at_as_operator_argument ----
Ap(F(_), v) == F(v)
Op == \A a \in {1} : a = 1
Test == Ap(Op!@, 1) /\ ~Ap(Op!@, 2)
====

(*--- recorded
all:
  exit: 0
---*)
