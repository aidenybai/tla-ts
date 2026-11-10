(*---
description: Evaluates a random int expression, seed 262, number 5393.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05393 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(UNION {DOMAIN <<5, 6>>, ({1} \cup 1..3)}) - Len(Tail(SortSeq(<<1>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
