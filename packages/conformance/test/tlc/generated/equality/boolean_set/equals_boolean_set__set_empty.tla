(*---
description: Compares boolean_set, a SetEnumValue, with set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_boolean_set__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) = ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
