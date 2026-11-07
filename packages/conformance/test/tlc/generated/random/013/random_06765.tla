(*---
description: Evaluates a random set expression, seed 262, number 6765.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06765 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SelectSeq(SelectSeq(<<{1, 2}, 1>>, LAMBDA e : e > 0), LAMBDA e : e > 0), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of > should be an integer, but instead it is:
    {1, 2}
    2266:0 The first argument of > should be an integer, but instead it is:
    {1, 2}
---*)
