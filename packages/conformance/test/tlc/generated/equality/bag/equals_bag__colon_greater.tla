(*---
description: Compares bag, a FcnRcdValue, with colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_bag__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) = (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
