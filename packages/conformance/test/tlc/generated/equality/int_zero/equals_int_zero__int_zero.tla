(*---
description: Compares int_zero, a IntValue, with int_zero, a IntValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_zero__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) = (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
