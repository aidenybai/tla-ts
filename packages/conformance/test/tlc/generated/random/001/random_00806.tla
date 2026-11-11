(*---
description: Evaluates a random int expression, seed 262, number 806.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00806 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([SortSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q) EXCEPT ![1] = Cardinality(UNION {{}, {}})]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
