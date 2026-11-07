(*---
description: Evaluates a random seq expression, seed 262, number 6965.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06965 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(([Append(<<>>, 0) EXCEPT ![1] = (2147483647 % -1)] \o [Tail(<<3, 1, 2>>) EXCEPT ![1] = (2147483647 % 7)]), LAMBDA e : e > 0))
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
