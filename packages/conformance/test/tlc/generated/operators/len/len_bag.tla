(*---
description: len applied to bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Len
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE len_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
