(*---
description: All matching keeps everything.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_all ----
EXTENDS Sequences, Naturals
Test == SelectSeq(<<1, 2>>, LAMBDA e : TRUE) = <<1, 2>>
====

(*--- recorded
all:
  exit: 0
---*)
