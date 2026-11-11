(*---
description: subbag applied to bag, a FcnRcdValue.
ref: tlc2/module/Bags.java#SubBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subbag_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubBag(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>, <<1>>}"
---*)
