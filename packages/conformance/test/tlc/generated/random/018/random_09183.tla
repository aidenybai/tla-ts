(*---
description: Evaluates a random seq expression, seed 262, number 9183.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09183 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0), LAMBDA p, q : p < q) \o SortSeq(<<(2147483647 - 7), Head(<<1, 2>>)>>, LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2147483640>>"
---*)
