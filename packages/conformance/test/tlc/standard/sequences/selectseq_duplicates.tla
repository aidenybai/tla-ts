(*---
description: Duplicates stay.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_duplicates ----
EXTENDS Sequences, Naturals
Test == SelectSeq(<<2, 1, 2>>, LAMBDA e : e = 2) = <<2, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
