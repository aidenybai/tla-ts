(*---
description: Asks whether int_negative is in set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_ints__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) \in ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
