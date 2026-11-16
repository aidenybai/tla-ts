(*---
description: cap of interval_empty, a IntervalValue, and seq_set, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval_empty__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cap (Seq({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
