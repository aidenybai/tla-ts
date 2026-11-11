(*---
description: forall_over applied to record, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in [a |-> 1, b |-> 2] : TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module forall_over_record failed.
    TLC encountered a non-enumerable quantifier bound
    [a |-> 1, b |-> 2].
    line 14, col 25 to line 14, col 42 of module forall_over_record
---*)
