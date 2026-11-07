(*---
description: The empty sequence returns early, so a non-Boolean test is never evaluated.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_empty_skips_test ----
EXTENDS Sequences, Naturals
Test == SelectSeq(<<>>, LAMBDA e : 1) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
