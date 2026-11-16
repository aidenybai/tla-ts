(*---
description: m > n with negative bounds is empty.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_empty_range_negative ----
EXTENDS Sequences, Naturals
Test == SubSeq(<<1>>, 0 - 1, 0 - 5) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
