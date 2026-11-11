(*---
description: "A set of records with a Nat field answers membership without enumerating."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_through_nat ----
EXTENDS Integers
Test == [a |-> 1] \in [a : Nat] /\ [a |-> -1] \notin [a : Nat]
====

(*--- recorded
all:
  exit: 0
---*)
