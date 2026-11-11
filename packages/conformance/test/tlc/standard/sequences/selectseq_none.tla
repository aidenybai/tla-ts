(*---
description: No match gives the empty sequence.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_none ----
EXTENDS Sequences, Naturals
Test == SelectSeq(<<1>>, LAMBDA e : FALSE) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
