(*---
description: implies_left applied to seq_set, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_implies
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE implies_left_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Seq({1}) => TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module implies_left_seq_set failed.
    Attempted to evaluate an expression of form P => Q when P was
    a special set constant.
    line 14, col 16 to line 14, col 31 of module implies_left_seq_set
---*)
