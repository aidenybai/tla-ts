(*---
description: colon_greater of cross, a SetOfTuplesValue, and model_value, a ModelValue.
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
---- MODULE colon_greater_cross__model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(({1, 2} \X {3}) :> (mv))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({<<1, 3>>, <<2, 3>>} :> mv)"
---*)
