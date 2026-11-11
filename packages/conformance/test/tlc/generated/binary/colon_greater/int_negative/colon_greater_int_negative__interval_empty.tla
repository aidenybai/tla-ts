(*---
description: colon_greater of int_negative, a IntValue, and interval_empty, a IntervalValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_negative__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) :> (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-3 :> {})"
---*)
