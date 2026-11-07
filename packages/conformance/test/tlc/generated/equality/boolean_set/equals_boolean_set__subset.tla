(*---
description: Compares boolean_set, a SetEnumValue, with subset, a SubsetValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_boolean_set__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) = (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
