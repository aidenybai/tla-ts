(*---
description: Evaluates a random seq expression, seed 262, number 1523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({b2421 : b2421 \in {1, 2}} \ Tail(<<1, 2>>))) \o Tail(SubSeq(Tail(<<3, 1, 2>>), (2 \div 3), (3 \div 2147483647)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01523 failed.
    Attempted to check set membership in a tuple value.
---*)
