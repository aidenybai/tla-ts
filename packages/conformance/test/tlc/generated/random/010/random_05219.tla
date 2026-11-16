(*---
description: Evaluates a random int expression, seed 262, number 5219.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05219 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8094 == Head(<<([a |-> 1]).a, IF TRUE THEN 7 ELSE -1>>) IN Head(Tail(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
