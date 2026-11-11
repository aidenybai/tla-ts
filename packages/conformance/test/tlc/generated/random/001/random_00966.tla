(*---
description: Evaluates a random int expression, seed 262, number 966.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00966 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<Cardinality(UNION {1..3, {2, 1, 3}}), Len(SortSeq(<<1>>, LAMBDA p, q : p < q))>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
