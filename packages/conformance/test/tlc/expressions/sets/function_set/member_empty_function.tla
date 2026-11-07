(*---
description: "The empty tuple and the empty function belong to [{} -> T]."
ref: "tlc2/value/impl/SetOfFcnsValue.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE member_empty_function ----
EXTENDS Integers
Test == <<>> \in [{} -> Nat] /\ [x \in {} |-> 1] \in [{} -> Nat]
====

(*--- recorded
all:
  exit: 0
---*)
