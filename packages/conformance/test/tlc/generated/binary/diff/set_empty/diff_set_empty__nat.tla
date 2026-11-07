(*---
description: diff of set_empty, a SetEnumValue, and nat, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
