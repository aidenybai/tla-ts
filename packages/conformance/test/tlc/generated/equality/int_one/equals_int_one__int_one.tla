(*---
description: Compares int_one, a IntValue, with int_one, a IntValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_one__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) = (1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
