(*---
description: cup of record, a RecordValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_record__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> 2]"
---*)
