(*---
description: Asks whether set_mixed is in set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_empty__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, "a"}) \in ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
