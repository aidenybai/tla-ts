(*---
description: Evaluates a random int expression, seed 262, number 5299.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05299 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<Tail(<<2147483647, 0>>), IF (2 \in {}) THEN Head(<<>>) ELSE (-1 + 1)>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
