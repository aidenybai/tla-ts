(*---
description: Evaluates a random seq expression, seed 262, number 3572.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03572 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(Tail(<<1>>) \o Tail(<<1, 2>>)) EXCEPT ![1] = (([a |-> 1]).a \div (-1 \div 3))] \o SubSeq(SelectSeq(Tail(<<3, 1, 2>>), LAMBDA e : e > 0), Cardinality({b5640 \in {2, 1, 3} : FALSE}), Len(SortSeq(<<>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
