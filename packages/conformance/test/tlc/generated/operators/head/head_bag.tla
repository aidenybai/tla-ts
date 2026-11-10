(*---
description: head applied to bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
