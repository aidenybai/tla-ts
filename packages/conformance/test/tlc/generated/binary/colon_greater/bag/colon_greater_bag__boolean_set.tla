(*---
description: colon_greater of bag, a FcnRcdValue, and boolean_set, a SetEnumValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_bag__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) :> (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<1>> :> {FALSE, TRUE})"
---*)
