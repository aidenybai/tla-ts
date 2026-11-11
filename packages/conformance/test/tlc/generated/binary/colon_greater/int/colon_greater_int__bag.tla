(*---
description: colon_greater of int, a UserValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> <<1>>)"
---*)
