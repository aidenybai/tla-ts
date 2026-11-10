(*---
description: colon_greater_key applied to bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag({1}) :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1>> :> 1)"
---*)
