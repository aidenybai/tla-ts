(*---
description: colon_greater of bag, a FcnRcdValue, and false, a BoolValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> (FALSE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1>> :> FALSE)"
---*)
