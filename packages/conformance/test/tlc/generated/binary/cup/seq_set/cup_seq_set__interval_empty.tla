(*---
description: cup of seq_set, a UserValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_seq_set__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Seq({1})"
---*)
