(*---
description: Evaluates a random seq expression, seed 262, number 2973.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02973 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SelectSeq(<<1, 2147483647>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) \o Tail(SelectSeq(<<1, -1>>, LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2147483647>>"
---*)
