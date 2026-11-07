(*---
description: Evaluates a random seq expression, seed 262, number 3451.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03451 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(SubSeq(Tail(<<>>), (1 - FALSE), (7 % 2..1)), LAMBDA e : e > 0) \o Append(SubSeq(Tail(<<1, 2>>), (-2), Head(<<1, 2>>)), Cardinality({b5471 \in 2..1 : TRUE}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
