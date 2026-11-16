(*---
description: A named operator works.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_named_operator ----
EXTENDS Sequences, Naturals
IsTwo(e) == e = 2
Test == SelectSeq(<<1, 2>>, IsTwo) = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)
