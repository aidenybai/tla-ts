(*---
description: colon_greater of set_cap, a SetCapValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cap__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) :> (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2} :> <<2>>)"
---*)
