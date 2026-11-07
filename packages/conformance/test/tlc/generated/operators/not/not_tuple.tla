(*---
description: not applied to tuple, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~(<<1, 2>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_tuple failed.
    Attempted to apply the operator ~ to a non-boolean
    (a tuple)
    line 14, col 16 to line 14, col 26 of module not_tuple
---*)
