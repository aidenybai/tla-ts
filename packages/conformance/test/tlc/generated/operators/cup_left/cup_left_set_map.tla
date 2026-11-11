(*---
description: cup_left applied to set_map, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x + 1 : x \in 1..2} \cup {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3, 9}"
---*)
