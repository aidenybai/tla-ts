(*---
description: The full range returns the sequence.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_whole ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1, 2>>, 1, 2) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
