(*---
description: Evaluates a random set expression, seed 262, number 2196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((Tail(<<1>>) \o SortSeq(<<1, 2>>, LAMBDA p, q : p < q))) .. ((Head(<<1>>) - (1 % 0)) * ([[x \in Nat |-> x + 1] EXCEPT ![2] = 2147483647])[(<<5, 6>>)[7]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
