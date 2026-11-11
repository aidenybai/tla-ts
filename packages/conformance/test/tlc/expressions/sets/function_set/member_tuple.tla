(*---
description: "A tuple is a function on 1..n."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_tuple ----
EXTENDS Integers
Test == <<1, 2>> \in [1..2 -> Nat] /\ <<1, 2>> \in [{1, 2} -> Nat]
====

(*--- recorded
all:
  exit: 0
---*)
