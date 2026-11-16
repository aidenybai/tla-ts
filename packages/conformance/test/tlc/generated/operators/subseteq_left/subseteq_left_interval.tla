(*---
description: subseteq_left applied to interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_left_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(1..3 \subseteq {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
