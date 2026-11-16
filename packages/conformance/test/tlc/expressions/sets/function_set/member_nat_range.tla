(*---
description: "A function set with range Nat answers membership by asking Nat."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_nat_range ----
EXTENDS Integers
Test == <<1>> \in [{1} -> Nat] /\ <<-1>> \notin [{1} -> Nat]
====

(*--- recorded
all:
  exit: 0
---*)
