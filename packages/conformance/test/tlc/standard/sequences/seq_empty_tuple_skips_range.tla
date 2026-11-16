(*---
description: <<>> \in Seq(3) is TRUE, because no element is tested against the bad range.
ref: tlc2/module/Sequences.java#member
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE seq_empty_tuple_skips_range ----
EXTENDS Sequences, Naturals
Test == <<>> \in Seq(3)
====

(*--- recorded
all:
  exit: 0
---*)
