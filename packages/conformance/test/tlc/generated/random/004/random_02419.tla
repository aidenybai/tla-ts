(*---
description: Evaluates a random int expression, seed 262, number 2419.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02419 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(SortSeq([(<<1>> \o <<3, 1, 2>>) EXCEPT ![1] = (<<5, 6>>)[2]], LAMBDA p, q : p < q), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, 3, 6>>"
---*)
