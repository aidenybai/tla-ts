(*---
description: colon_greater of false, a BoolValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> <<1>>)"
---*)
