(*---
description: Evaluates a random seq expression, seed 262, number 7794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q), LAMBDA p, q : p < q) \o SelectSeq(Append((<<1, 2>> \o <<1, 2>>), {0 : b12020 \in {1}}), LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    {0}
    2266:0 The first argument of > should be an integer, but instead it is:
    {0}
---*)
