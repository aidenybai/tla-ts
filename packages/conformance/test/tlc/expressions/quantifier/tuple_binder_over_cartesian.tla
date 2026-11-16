(*---
description: "A tuple binder over a Cartesian product binds each component."
ref: "tlc2/tool/ContextEnumerator.java#nextElement"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_over_cartesian ----
EXTENDS Integers
Test == \A <<a, b>> \in {1} \X {2, 3} : a = 1 /\ b \in {2, 3}
====

(*--- recorded
all:
  exit: 0
---*)
