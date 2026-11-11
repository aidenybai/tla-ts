(*---
description: Compares nat, a UserValue, with nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_nat__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) = (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
