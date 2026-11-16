(*---
description: Evaluates a random seq expression, seed 262, number 6488.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06488 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SubSeq(SortSeq(<<2, 7>>, LAMBDA p, q : p < q), Cardinality((1..3 \cap {1, 2})), Cardinality({b9975 \in {1} : TRUE})) \o Tail([Append(<<1, 2>>, 2147483647) EXCEPT ![1] = Cardinality({})])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 2147483647>>"
---*)
