(*---
description: and_right applied to tuple_mixed, a TupleValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_right_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE /\ <<1, "a", {TRUE}>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_right_tuple_mixed failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a tuple.
    line 14, col 16 to line 14, col 41 of module and_right_tuple_mixed
---*)
