(*---
description: Compares boolean_set, a SetEnumValue, with boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_boolean_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) = (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
