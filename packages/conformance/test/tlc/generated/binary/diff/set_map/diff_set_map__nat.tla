(*---
description: diff of set_map, a SetEnumValue, and nat, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_map__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \ (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
