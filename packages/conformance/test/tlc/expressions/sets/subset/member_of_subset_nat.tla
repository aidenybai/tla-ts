(*---
description: "SUBSET Nat answers membership of a finite set by asking Nat about each element."
ref: "tlc2/value/impl/SubsetValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_of_subset_nat ----
EXTENDS Integers
Test == {1, 2} \in SUBSET Nat /\ {-1} \notin SUBSET Nat
====

(*--- recorded
all:
  exit: 0
---*)
