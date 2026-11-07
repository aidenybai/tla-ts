(*---
description: Evaluates a random seq expression, seed 262, number 7760.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07760 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Tail(Append(Tail(<<3, 1, 2>>), LET b11967 == 3 IN <<5, 6>>)), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    <<5, 6>>
    2266:0 The first argument of < should be an integer, but instead it is:
    <<5, 6>>
---*)
