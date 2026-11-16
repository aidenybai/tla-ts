(*---
description: Evaluates a random function expression, seed 262, number 7705.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07705 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SortSeq([(<<1>> \o <<>>) EXCEPT ![1] = (CHOOSE b11881 \in SUBSET {1} : TRUE)], LAMBDA p, q : p < q), SortSeq(Append(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LET b11882 == 2 IN b11882), LAMBDA p, q : p < q)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{}, <<1, 2, 2, 3>>>>"
---*)
