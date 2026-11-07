(*---
description: implies_right applied to set_filter, a SetPredValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_implies
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE implies_right_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE => {x \in 1..3 : x > 1})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module implies_right_set_filter failed.
    Attempted to evaluate an expression of form P => Q when Q was
    a set of the form {e1, ... ,eN}.
    line 14, col 16 to line 14, col 43 of module implies_right_set_filter
---*)
