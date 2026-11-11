(*---
description: or_right applied to record_nested, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_right_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(FALSE \/ [a |-> [b |-> <<1>>]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module or_right_record_nested failed.
    Attempted to evaluate an expression of form P \/ Q when Q was
    a record.
    line 14, col 16 to line 14, col 45 of module or_right_record_nested
---*)
