(*---
description: colon_greater of set_map, a SetEnumValue, and model_value, a ModelValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE colon_greater_set_map__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({x + 1 : x \in 1..2}) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2, 3} :> mv)"
---*)
