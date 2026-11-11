(*---
description: colon_greater of set_cap, a SetCapValue, and true, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cap__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) :> (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2} :> TRUE)"
---*)
