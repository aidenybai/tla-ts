(*---
description: A subexpression of an operator with a parameter becomes an operator of that parameter.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [subexpressions]
flags: [expression]
outcome: success
---*)
---- MODULE parameterized_selector_as_operator ----
EXTENDS Naturals
Ap(F(_), x) == F(x)
Op(a) == a + 1
Test == Ap(Op!1, 7) = 7
====

(*--- recorded
all:
  exit: 0
---*)
