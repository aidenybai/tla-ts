(*---
description: Evaluates a random seq expression, seed 262, number 4073.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04073 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SortSeq(Tail(<<3, 2147483647>>), LAMBDA p, q : p < q), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647>>"
---*)
