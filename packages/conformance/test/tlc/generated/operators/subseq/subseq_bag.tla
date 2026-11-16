(*---
description: subseq applied to bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SetToBag({1}), 1, 1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
