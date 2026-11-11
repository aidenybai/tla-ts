(*---
description: except_field applied to record, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> 1, b |-> 2] EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 9, b |-> 2]"
---*)
