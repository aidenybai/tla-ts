(*---
description: Evaluates a random seq expression, seed 262, number 8724.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08724 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<(-(7 % 0)), IF (CHOOSE r \in [a : {1, 2}] : TRUE) THEN (FALSE - 2) ELSE (7 \div 2)>> \o SortSeq(SortSeq(Tail(<<>>), LAMBDA p, q : p < q), LAMBDA p, q : p < q)))
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
