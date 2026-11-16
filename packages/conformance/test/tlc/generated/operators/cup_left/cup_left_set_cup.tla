(*---
description: cup_left applied to set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1} \cup {2} \cup {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 9}"
---*)
