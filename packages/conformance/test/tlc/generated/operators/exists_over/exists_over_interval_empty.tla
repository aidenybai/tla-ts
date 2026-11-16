(*---
description: exists_over applied to interval_empty, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_bf
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE exists_over_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(\E e \in 3..1 : TRUE)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
