(*---
description: m > n is empty before any bounds check, however far out of range.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_empty_range_out_of_bounds ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1, 2>>, 9, 5) = <<>> /\ SubSeq(<<>>, 1, 0) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
