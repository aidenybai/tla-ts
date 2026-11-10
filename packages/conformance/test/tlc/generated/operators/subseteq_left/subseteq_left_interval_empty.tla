(*---
description: subseteq_left applied to interval_empty, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_left_interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(3..1 \subseteq {1, 2})
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
