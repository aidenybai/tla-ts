(*---
description: Evaluates a random seq expression, seed 262, number 7552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(Tail(Tail(<<3, 1, 2>>)), LAMBDA p, q : p < q) \o <<LET b11632 == (7 + 3) IN (b11632 - b11632), Cardinality({2, 0})>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 0, 2>>"
---*)
