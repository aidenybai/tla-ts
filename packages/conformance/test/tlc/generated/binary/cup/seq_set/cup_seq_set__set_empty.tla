(*---
description: cup of seq_set, a UserValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_seq_set__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| Seq({1})"
---*)
