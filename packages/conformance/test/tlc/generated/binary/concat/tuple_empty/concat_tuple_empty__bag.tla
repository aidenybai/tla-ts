(*---
description: concat of tuple_empty, a TupleValue, and bag, a FcnRcdValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_tuple_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) \o (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1>>"
---*)
