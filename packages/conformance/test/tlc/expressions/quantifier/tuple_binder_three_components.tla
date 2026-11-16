(*---
description: "A tuple binder can have more than two components."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_three_components ----
EXTENDS Integers
Test == \E <<a, b, c>> \in {<<1, 2, 3>>} : a + b + c = 6
====

(*--- recorded
all:
  exit: 0
---*)
