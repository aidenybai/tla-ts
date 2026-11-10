(*---
description: diff of interval, a IntervalValue, and nat, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \ (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
