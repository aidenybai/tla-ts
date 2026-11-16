(*---
description: Asks whether int_maximum is in int, a UserValue.
ref: tlc2/value/impl/UserValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_int__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) \in (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
