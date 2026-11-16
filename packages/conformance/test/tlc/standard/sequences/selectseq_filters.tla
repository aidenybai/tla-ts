(*---
description: SelectSeq keeps matching elements in order.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_filters ----
EXTENDS Sequences, Naturals
Test == SelectSeq(<<1, 2, 3, 4>>, LAMBDA e : e > 2) = <<3, 4>>
====

(*--- recorded
all:
  exit: 0
---*)
