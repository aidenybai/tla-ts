(*---
description: One element.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_single ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1, 2>>, 2, 2) = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)
