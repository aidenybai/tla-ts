(*---
description: "A nested quantifiers bound can use the outer variable, and it runs once per outer binding."
ref: "tlc2/tool/impl/Tool.java#contexts"
flags: [expression]
outcome: success
---*)
---- MODULE nested_quantifier_inner_bound_uses_outer ----
EXTENDS Integers
Test == \E x \in 1..2 : \E y \in 1..x : y = 2
====

(*--- recorded
all:
  exit: 0
---*)
