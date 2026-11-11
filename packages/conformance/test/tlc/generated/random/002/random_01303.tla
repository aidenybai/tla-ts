(*---
description: Evaluates a random seq expression, seed 262, number 1303.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01303 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(Tail(<<3, 3>>), LAMBDA p, q : p < q) \o SortSeq(<<IF TRUE THEN 3 ELSE 1, ([a |-> 1]).a>>, LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<3, 1, 3>>"
---*)
