(*---
description: selectseq applied to bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SetToBag({1}), LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
