(*---
description: diff of set_cap, a SetCapValue, and nat, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_cap__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \ (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
