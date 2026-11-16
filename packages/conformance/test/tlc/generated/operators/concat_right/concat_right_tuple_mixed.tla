(*---
description: concat_right applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Sequences.java#Concat
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE concat_right_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<9>> \o <<1, "a", {TRUE}>>)
====

(*--- recorded
all:
  exit: 0
  transcript: '| <<9, 1, "a", {TRUE}>>'
---*)
