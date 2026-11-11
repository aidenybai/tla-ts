(*---
description: "A lazy LET definition remembers the value of the variable it closes over."
ref: "tlc2/tool/impl/Tool.java#evalImplLetInKind"
flags: [expression]
outcome: success
---*)
---- MODULE let_captures_enclosing_bound_variable ----
EXTENDS Integers
Test == \A x \in 1..3 : LET a == x IN LET b == a * 2 IN b = 2 * x
====

(*--- recorded
all:
  exit: 0
---*)
