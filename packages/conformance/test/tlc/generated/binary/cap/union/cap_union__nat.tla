(*---
description: cap of union, a UnionValue, and nat, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_union__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {{1}, {2}}) \cap (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
