(*---
description: subseteq_right applied to interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_right_interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \subseteq 1..3)
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
