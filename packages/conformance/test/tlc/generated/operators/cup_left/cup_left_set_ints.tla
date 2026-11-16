(*---
description: cup_left applied to set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({2, 1} \cup {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 9}"
---*)
