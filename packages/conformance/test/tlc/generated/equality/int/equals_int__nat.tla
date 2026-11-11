(*---
description: Compares int, a UserValue, with nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) = (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
