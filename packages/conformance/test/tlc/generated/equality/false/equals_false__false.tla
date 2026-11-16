(*---
description: Compares false, a BoolValue, with false, a BoolValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_false__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) = (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
