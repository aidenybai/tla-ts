(*---
description: Evaluates a random int expression, seed 262, number 8297.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08297 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail(Append(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), IF FALSE THEN 0 ELSE 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
