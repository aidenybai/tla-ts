(*---
description: Compares int, a UserValue, with int, a UserValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) = (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
