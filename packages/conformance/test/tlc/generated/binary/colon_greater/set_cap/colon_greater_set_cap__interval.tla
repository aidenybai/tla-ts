(*---
description: colon_greater of set_cap, a SetCapValue, and interval, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cap__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) :> (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({2} :> 1..3)"
---*)
