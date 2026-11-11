(*---
description: cap of set_diff, a SetDiffValue, and int, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_diff__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \cap (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1}"
---*)
