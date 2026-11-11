(*---
description: cap of int, a UserValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) \cap ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
