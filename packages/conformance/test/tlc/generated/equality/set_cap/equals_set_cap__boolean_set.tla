(*---
description: Compares set_cap, a SetCapValue, with boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_cap__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) = (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
