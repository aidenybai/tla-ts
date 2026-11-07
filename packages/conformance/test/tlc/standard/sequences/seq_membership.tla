(*---
description: A tuple over S is in Seq(S).
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_membership ----
EXTENDS Sequences, Naturals
Test == <<1, 2>> \in Seq({1, 2}) /\ <<3>> \notin Seq({1, 2})
====

(*--- recorded
all:
  exit: 0
---*)
