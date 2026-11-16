(*---
description: cup of interval_empty, a IntervalValue, and nat, a UserValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_interval_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cup (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Nat"
---*)
