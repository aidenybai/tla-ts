(*---
description: Seq sets compare by their ranges.
ref: tlc2/module/Sequences.java#compareTo
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_equal_same_range ----
EXTENDS Sequences, Naturals
Test == Seq({1}) = Seq({1}) /\ Seq({}) = Seq({})
====

(*--- recorded
all:
  exit: 0
---*)
