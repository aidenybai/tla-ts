(*---
description: "A filter binder over a non-Reducible S \\X T enumerates through SetPredValue."
ref: "tlc2/value/impl/SetPredValue.java#Enumerator"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_lazy_over_cartesian ----
EXTENDS Integers
Test == {<<a, b>> \in {1, 2} \X {1, 2} : a < b} = {<<1, 2>>}
====

(*--- recorded
all:
  exit: 0
---*)
