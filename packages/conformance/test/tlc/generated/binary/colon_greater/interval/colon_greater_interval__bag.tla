(*---
description: colon_greater of interval, a IntervalValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_interval__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (1..3 :> <<1>>)"
---*)
