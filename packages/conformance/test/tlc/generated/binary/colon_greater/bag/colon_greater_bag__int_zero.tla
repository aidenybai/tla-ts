(*---
description: colon_greater of bag, a FcnRcdValue, and int_zero, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> (0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1>> :> 0)"
---*)
