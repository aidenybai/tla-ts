(*---
description: "Membership in a tuple-binder filter converts an equal function through toTuple."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_lazy_member_accepts_function ----
EXTENDS Integers
Test == [i \in 1..2 |-> i] \in {<<a, b>> \in Nat \X Nat : a < b}
====

(*--- recorded
all:
  exit: 0
---*)
