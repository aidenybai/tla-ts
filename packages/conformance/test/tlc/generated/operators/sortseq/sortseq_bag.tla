(*---
description: sortseq applied to bag, a FcnRcdValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SetToBag({1}), LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
