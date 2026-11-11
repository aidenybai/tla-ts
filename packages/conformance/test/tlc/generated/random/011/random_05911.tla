(*---
description: Evaluates a random int expression, seed 262, number 5911.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05911 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(Tail(Append(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), IF FALSE THEN 0 ELSE -1))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
