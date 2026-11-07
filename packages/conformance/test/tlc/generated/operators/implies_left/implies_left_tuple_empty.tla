(*---
description: implies_left applied to tuple_empty, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_implies
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE implies_left_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<>> => TRUE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module implies_left_tuple_empty failed.
    Attempted to evaluate an expression of form P => Q when P was
    a tuple.
    line 14, col 16 to line 14, col 27 of module implies_left_tuple_empty
---*)
