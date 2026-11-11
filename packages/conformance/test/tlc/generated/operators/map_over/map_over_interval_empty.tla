(*---
description: map_over applied to interval_empty, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_sso
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE map_over_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({e : e \in 3..1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
