(*---
description: map_over applied to interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in 1..3})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
