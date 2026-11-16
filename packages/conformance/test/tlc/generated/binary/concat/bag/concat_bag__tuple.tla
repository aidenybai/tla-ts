(*---
description: concat of bag, a FcnRcdValue, and tuple, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_bag__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \o (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 2>>"
---*)
