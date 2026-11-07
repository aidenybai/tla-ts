(*---
description: SelectSeq converts a function with domain 1..n.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - Sequences
flags:
  - expression
outcome: success
---*)
---- MODULE selectseq_function ----
EXTENDS Sequences, Naturals
Test == SelectSeq([i \in 1..3 |-> i], LAMBDA e : e # 2) = <<1, 3>>
====

(*--- recorded
all:
  exit: 0
---*)
