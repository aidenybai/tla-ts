(*---
description: Asks whether int_negative is in union, a UnionValue.
ref: tlc2/value/impl/UnionValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_union__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \in (UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
