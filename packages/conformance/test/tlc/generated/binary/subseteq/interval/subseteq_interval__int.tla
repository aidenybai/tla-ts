(*---
description: subseteq of interval, a IntervalValue, and int, a UserValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_interval__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \subseteq (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
