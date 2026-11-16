(*---
description: A function with domain 1..n is in Seq(S).
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_function_member ----
EXTENDS Sequences, Naturals
Test == [i \in 1..2 |-> i] \in Seq(Nat)
====

(*--- recorded
all:
  exit: 0
---*)
