(*---
description: "Membership in a tuple-binder filter over Nat \\X Nat binds the components."
ref: "tlc2/value/impl/SetPredValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE tuple_binder_lazy_member ----
EXTENDS Integers
Test == <<1, 2>> \in {<<a, b>> \in Nat \X Nat : a < b} /\ <<2, 1>> \notin {<<a, b>> \in Nat \X Nat : a < b}
====

(*--- recorded
all:
  exit: 0
---*)
