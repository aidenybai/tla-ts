(*---
description: "The empty tuple belongs to Seq of anything, even of {}."
ref: "tlc2/module/Sequences.java#member"
flags: [expression]
outcome: success
---*)
---- MODULE empty_sequence_in_any_seq ----
EXTENDS Integers, Sequences
Test == <<>> \in Seq({}) /\ <<>> \in Seq(Nat)
====

(*--- recorded
all:
  exit: 0
---*)
