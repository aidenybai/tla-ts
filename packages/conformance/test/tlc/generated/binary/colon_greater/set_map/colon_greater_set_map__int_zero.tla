(*---
description: colon_greater of set_map, a SetEnumValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_map__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2, 3} :> 0)"
---*)
