(*---
description: Evaluates a random seq expression, seed 262, number 9294.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09294 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(Tail(SortSeq(<<7, 7>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
