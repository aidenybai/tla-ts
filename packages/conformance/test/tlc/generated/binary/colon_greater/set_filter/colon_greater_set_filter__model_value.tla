(*---
description: colon_greater of set_filter, a SetPredValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_set_filter__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({x \in 1..3 : x > 1}) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2, 3} :> mv)"
---*)
