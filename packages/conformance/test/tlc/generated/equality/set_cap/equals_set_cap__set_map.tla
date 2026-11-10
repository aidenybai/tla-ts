(*---
description: Compares set_cap, a SetCapValue, with set_map, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_cap__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) = ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
