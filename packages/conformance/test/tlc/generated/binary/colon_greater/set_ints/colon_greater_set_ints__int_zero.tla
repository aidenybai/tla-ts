(*---
description: colon_greater of set_ints, a SetEnumValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_ints__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> 0)"
---*)
