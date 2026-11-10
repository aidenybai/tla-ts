(*---
description: copies_in applied to bag, a FcnRcdValue.
ref: tlc2/module/Bags.java#CopiesIn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE copies_in_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CopiesIn(1, SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
