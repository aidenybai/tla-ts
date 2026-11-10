(*---
description: subseteq of interval, a IntervalValue, and set_empty, a SetEnumValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_interval__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \subseteq ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
