(*---
description: colon_greater of bag, a FcnRcdValue, and int, a UserValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1>> :> Int)"
---*)
