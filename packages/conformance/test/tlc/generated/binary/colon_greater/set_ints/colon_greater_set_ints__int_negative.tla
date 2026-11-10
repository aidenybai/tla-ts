(*---
description: colon_greater of set_ints, a SetEnumValue, and int_negative, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_ints__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) :> (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> -3)"
---*)
