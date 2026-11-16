(*---
description: Compares true, a BoolValue, with true, a BoolValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_true__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) = (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
