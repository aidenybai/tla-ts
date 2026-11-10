(*---
description: Evaluates a random int expression, seed 262, number 1156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(<<LET b1853 == 2147483647 IN b1853, (2 * 3)>>, LAMBDA e : e > 0) \o SortSeq(SubSeq(SelectSeq(<<1>>, LAMBDA e : e > 0), (3 % 2), Cardinality(2..1)), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2147483647, 6>>"
---*)
