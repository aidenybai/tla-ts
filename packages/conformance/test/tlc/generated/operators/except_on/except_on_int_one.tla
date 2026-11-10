(*---
description: except_on applied to int_one, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_exc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE except_on_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([1 EXCEPT ![1] = 9])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module except_on_int_one failed.
    Attempted to apply EXCEPT construct to the value 1.
---*)
