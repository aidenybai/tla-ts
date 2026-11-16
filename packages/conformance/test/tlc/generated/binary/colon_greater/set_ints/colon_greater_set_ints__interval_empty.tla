(*---
description: colon_greater of set_ints, a SetEnumValue, and interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_ints__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) :> (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> {})"
---*)
