(*---
description: Compares int_zero, a IntValue, with int_maximum, a IntValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_zero__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) = (2147483647))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
