(*---
description: colon_greater of bag, a FcnRcdValue, and int_negative, a IntValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> (-3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1>> :> -3)"
---*)
