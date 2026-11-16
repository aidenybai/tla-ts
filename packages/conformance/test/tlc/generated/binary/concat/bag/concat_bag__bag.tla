(*---
description: concat of bag, a FcnRcdValue, and bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_bag__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SetToBag({1})) \o (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
