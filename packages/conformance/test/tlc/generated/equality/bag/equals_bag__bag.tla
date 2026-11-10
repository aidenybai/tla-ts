(*---
description: Compares bag, a FcnRcdValue, with bag, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_bag__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) = (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
