(*---
description: not applied to seq_set, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~(Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_seq_set failed.
    Attempted to apply the operator ~ to a non-boolean
    (a special set constant)
    line 14, col 16 to line 14, col 26 of module not_seq_set
---*)
