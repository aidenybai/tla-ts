(*---
description: "A lazy argument is evaluated in the context of the caller, so a bound variable of the same name in the callee does not capture it."
ref: "tlc2/util/Context.java#lookup"
flags: [expression]
outcome: success
---*)
---- MODULE argument_closes_over_caller ----
EXTENDS Integers
F(a) == \E y \in {2} : a = y
Test == \A y \in {1} : ~F(y)
====

(*--- recorded
all:
  exit: 0
---*)
