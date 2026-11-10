(*---
description: choose_from applied to record, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in [a |-> 1, b |-> 2] : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module choose_from_record failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 16 to line 14, col 53 of module choose_from_record
---*)
