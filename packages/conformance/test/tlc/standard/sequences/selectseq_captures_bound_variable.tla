(*---
description: The LAMBDA can use a variable bound outside it.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_captures_bound_variable ----
EXTENDS Sequences, Naturals
Test == \A k \in {2} : SelectSeq(<<1, 2>>, LAMBDA e : e = k) = <<2>>
====

(*--- recorded
all:
  exit: 0
---*)
