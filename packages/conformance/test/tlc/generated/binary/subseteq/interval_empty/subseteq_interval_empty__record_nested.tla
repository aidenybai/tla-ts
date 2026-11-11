(*---
description: subseteq of interval_empty, a IntervalValue, and record_nested, a RecordValue.
ref: tlc2/tool/impl/Tool.java#OPCODE_subseteq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseteq_interval_empty__record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \subseteq ([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
