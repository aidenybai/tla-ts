(*---
description: "A LET operator passed as an argument still sees the LET definitions before it."
ref: "tlc2/tool/impl/Tool.java#evalImplOpArgKind"
flags: [expression]
outcome: success
---*)
---- MODULE let_operator_closes_over_let_value ----
EXTENDS Integers
Apply(g(_), z) == g(z)
Test == LET k == 5  add(z) == z + k IN Apply(add, 1) = 6
====

(*--- recorded
all:
  exit: 0
---*)
