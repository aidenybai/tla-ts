(*---
description: Evaluates a random int expression, seed 262, number 2661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([SubSeq(<<7, 0>>, (1 % 0), (<<>> \o <<>>)) EXCEPT ![1] = (-IF FALSE THEN -1 ELSE 2147483647)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02661 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
