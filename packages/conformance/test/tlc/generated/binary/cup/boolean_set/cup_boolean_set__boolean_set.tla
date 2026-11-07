(*---
description: cup of boolean_set, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_boolean_set__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) \cup (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {FALSE, TRUE}"
---*)
