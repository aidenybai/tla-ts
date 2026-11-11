(*---
description: except_field applied to record_nested, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> [b |-> <<1>>]] EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 9]"
---*)
