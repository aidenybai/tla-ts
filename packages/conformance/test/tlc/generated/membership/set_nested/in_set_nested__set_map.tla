(*---
description: Asks whether set_map is in set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_nested__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \in ({{1}, {}}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
