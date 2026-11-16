(*---
description: tail applied to bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Tail
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE tail_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
