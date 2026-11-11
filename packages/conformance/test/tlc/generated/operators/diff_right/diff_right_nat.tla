(*---
description: diff_right applied to nat, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_right_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ Nat)
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
