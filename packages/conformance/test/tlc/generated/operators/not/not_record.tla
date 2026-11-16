(*---
description: not applied to record, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_record failed.
    Attempted to apply the operator ~ to a non-boolean
    (a record)
    line 14, col 16 to line 14, col 36 of module not_record
---*)
