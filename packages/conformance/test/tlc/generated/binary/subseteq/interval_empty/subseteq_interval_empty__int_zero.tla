(*---
description: subseteq of interval_empty, a IntervalValue, and int_zero, a IntValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_interval_empty__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \subseteq (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
