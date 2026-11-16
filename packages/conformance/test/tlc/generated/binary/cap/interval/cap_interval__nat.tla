(*---
description: cap of interval, a IntervalValue, and nat, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \cap (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
