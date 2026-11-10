(*---
description: except_field applied to bag, a FcnRcdValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_field_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([SetToBag({1}) EXCEPT !.a = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_field_bag failed.
    Attempted to check equality of integer 1 with non-integer:
    "a"
---*)
