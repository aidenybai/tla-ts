(*---
description: not applied to int_minimum, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_int_minimum failed.
    Attempted to apply the operator ~ to a non-boolean
    (an integer)
    line 14, col 16 to line 14, col 35 of module not_int_minimum
---*)
