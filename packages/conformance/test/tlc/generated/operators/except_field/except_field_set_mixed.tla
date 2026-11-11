(*---
description: except_field applied to set_mixed, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1, "a"} EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_field_set_mixed failed.
    Attempted to compare string "a" with non-string:
    1
---*)
