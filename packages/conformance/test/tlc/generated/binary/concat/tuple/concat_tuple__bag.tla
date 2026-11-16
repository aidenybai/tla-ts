(*---
description: concat of tuple, a TupleValue, and bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_tuple__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) \o (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 1>>"
---*)
