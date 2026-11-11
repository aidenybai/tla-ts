(*---
description: colon_greater_key applied to set_cap, a SetCapValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \cap {2, 3} :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2} :> 1)"
---*)
