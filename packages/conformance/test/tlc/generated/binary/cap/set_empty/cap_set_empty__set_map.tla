(*---
description: cap of set_empty, a SetEnumValue, and set_map, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_empty__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cap ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
