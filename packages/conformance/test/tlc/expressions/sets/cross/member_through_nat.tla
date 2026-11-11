(*---
description: "A product of Nat with itself answers membership without enumerating."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_through_nat ----
EXTENDS Integers
Test == <<1, 2>> \in Nat \X Nat /\ <<-1, 2>> \notin Nat \X Nat
====

(*--- recorded
all:
  exit: 0
---*)
