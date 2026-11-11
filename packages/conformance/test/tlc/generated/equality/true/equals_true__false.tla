(*---
description: Compares true, a BoolValue, with false, a BoolValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_true__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) = (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
