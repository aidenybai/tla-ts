(*---
description: not applied to interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lnot
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE not_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(~(1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module not_interval failed.
    Attempted to apply the operator ~ to a non-boolean
    (a set of the form i..j)
    line 14, col 16 to line 14, col 22 of module not_interval
---*)
