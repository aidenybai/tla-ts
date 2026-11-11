(*---
description: Asks whether string_empty is in set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_empty__string_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(("") \in ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
