(*---
description: Different ranges give different Seq sets.
ref: tlc2/module/Sequences.java#compareTo
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_unequal_ranges ----
EXTENDS Sequences, Naturals
Test == Seq({1}) # Seq({2})
====

(*--- recorded
all:
  exit: 0
---*)
