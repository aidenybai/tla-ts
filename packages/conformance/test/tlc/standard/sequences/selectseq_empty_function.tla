(*---
description: An empty function is an empty sequence to SelectSeq.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_empty_function ----
EXTENDS Sequences, Naturals
Test == SelectSeq([x \in {} |-> 1], LAMBDA e : TRUE) = <<>>
====

(*--- recorded
all:
  exit: 0
---*)
