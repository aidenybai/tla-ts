(*---
description: "A tuple and an equal function both belong to Seq(S), and an unrelated function does not convert."
ref: "tlc2/module/Sequences.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE in_seq_set ----
EXTENDS Integers, Sequences
Test == <<1>> \in Seq(Nat) /\ [x \in {1} |-> 1] \in Seq(Nat)
====

(*--- recorded
all:
  exit: 0
---*)
