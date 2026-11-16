(*---
description: subseteq of interval_empty, a IntervalValue, and cross, a SetOfTuplesValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_interval_empty__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \subseteq ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
