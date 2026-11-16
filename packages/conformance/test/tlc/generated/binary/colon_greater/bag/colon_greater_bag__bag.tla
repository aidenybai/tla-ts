(*---
description: colon_greater of bag, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1>> :> <<1>>)"
---*)
