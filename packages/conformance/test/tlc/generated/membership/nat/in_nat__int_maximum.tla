(*---
description: Asks whether int_maximum is in nat, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_nat__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) \in (Nat))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
