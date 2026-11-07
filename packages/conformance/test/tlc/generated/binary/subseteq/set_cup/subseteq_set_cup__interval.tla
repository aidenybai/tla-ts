(*---
description: subseteq of set_cup, a SetCupValue, and interval, a IntervalValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_set_cup__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \subseteq (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
