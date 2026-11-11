(*---
description: forall_over applied to interval_empty, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_be
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE forall_over_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\A e \in 3..1 : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
