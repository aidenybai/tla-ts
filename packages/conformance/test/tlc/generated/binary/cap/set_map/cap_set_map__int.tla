(*---
description: cap of set_map, a SetEnumValue, and int, a UserValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_map__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \cap (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2, 3}"
---*)
