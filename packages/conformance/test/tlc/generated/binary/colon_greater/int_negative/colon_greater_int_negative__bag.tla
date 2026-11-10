(*---
description: colon_greater of int_negative, a IntValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int_negative__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (-3 :> <<1>>)"
---*)
