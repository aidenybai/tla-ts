(*---
description: cup of true, a BoolValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_true__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
