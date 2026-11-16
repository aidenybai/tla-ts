(*---
description: SubSeq converts a function with domain 1..n.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE subseq_function ----
EXTENDS Sequences, Naturals
Test == SubSeq([i \in 1..3 |-> i], 2, 3) = <<2, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
