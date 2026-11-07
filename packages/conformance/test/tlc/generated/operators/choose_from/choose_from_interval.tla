(*---
description: choose_from applied to interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bc
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE choose_from_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CHOOSE e \in 1..3 : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
