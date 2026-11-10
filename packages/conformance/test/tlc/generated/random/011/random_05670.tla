(*---
description: Evaluates a random int expression, seed 262, number 5670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len((SortSeq([<<1>> EXCEPT ![1] = 2147483647], LAMBDA p, q : p < q) \o SortSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
