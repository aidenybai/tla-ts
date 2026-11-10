(*---
description: and_left applied to tuple, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_left_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<1, 2>> /\ TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_left_tuple failed.
    Attempted to evaluate an expression of form P /\ Q when P was
    a tuple.
    line 14, col 16 to line 14, col 31 of module and_left_tuple
---*)
