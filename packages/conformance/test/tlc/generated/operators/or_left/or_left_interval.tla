(*---
description: or_left applied to interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_lor
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE or_left_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 \/ FALSE)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module or_left_interval failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a set of the form i..j.
    line 14, col 16 to line 14, col 28 of module or_left_interval
---*)
