(*---
description: Evaluates a random int expression, seed 262, number 5074.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05074 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ((2..1 = SUBSET {1}) \/ (\A b7896 \in SUBSET {1} : FALSE)) -> ((2147483647 \div 2147483647) + (-1 - [a |-> 1])) [] OTHER -> Cardinality({7, 7}) \div Len(SelectSeq(SortSeq(<<1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
