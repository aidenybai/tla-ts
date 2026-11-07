(*---
description: Evaluates a random int expression, seed 262, number 644.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00644 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(2..1) \div ([a |-> 1, b |-> TRUE]).a) + (-(1 % -1))) \div ([a |-> (0 + 3), b |-> (<<3, 1, 2>> = (1 :> 2))]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
