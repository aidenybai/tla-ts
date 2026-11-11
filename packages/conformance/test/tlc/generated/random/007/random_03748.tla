(*---
description: Evaluates a random seq expression, seed 262, number 3748.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03748 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq([(<<>> \o <<3, 1, 2>>) EXCEPT ![1] = Cardinality({2, 1, 3})], LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3>>"
---*)
