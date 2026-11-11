(*---
description: SubSeq takes an inclusive range.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_middle ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1, 2, 3, 4>>, 2, 3) = <<2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
