(*---
description: colon_greater of set_map, a SetEnumValue, and set_cup, a SetCupValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_map__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) :> ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2, 3} :> {1, 2})"
---*)
