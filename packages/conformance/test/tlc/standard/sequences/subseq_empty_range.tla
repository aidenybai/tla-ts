(*---
description: m = n + 1 is empty.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_empty_range ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1, 2>>, 2, 1) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
