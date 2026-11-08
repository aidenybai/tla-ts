(*---
description: Evaluates a random int expression, seed 262, number 3593.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03593 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append((<<1, 2>> \o <<>>), (0 % 0))) + (-[SelectSeq(<<1, 2>>, LAMBDA e : e > 0) EXCEPT ![1] = LET b5665 == 0 IN b5665])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03593 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
