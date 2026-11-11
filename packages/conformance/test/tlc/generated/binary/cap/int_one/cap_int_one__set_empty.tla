(*---
description: cap of int_one, a IntValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_int_one__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) \cap ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
