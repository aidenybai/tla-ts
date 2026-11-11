(*---
description: not applied to set_filter, a SetPredValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_set_filter failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form {e1, ... ,eN})
    line 14, col 16 to line 14, col 38 of module not_set_filter
---*)
