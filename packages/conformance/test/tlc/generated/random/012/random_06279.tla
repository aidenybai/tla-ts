(*---
description: Evaluates a random seq expression, seed 262, number 6279.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06279 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq([(<<3, 1, 2>> \o <<1, 2>>) EXCEPT ![1] = ([a |-> 1]).a], LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1, 1, 2, 2>>"
---*)
