(*---
description: and_right applied to interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_land
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE and_right_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(TRUE /\ 1..3)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module and_right_interval failed.
    Attempted to evaluate an expression of form P /\ Q when Q was
    a set of the form i..j.
    line 14, col 16 to line 14, col 27 of module and_right_interval
---*)
