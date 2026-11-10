(*---
description: colon_greater of set_cap, a SetCapValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cap__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2} :> 0)"
---*)
