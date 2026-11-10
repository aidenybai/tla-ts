(*---
description: colon_greater_key applied to set_map, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({x + 1 : x \in 1..2} :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2, 3} :> 1)"
---*)
