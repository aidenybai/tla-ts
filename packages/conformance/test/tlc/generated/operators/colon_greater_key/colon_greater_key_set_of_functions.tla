(*---
description: colon_greater_key applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{1} -> {2, 3}] :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({<<2>>, <<3>>} :> 1)"
---*)
