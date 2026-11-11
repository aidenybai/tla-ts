(*---
description: not applied to record_nested, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_record_nested failed.
    Attempted to apply the operator ~ to a non-boolean
    (a record)
    line 14, col 16 to line 14, col 39 of module not_record_nested
---*)
