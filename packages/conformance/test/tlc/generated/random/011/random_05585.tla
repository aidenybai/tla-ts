(*---
description: Evaluates a random record expression, seed 262, number 5585.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05585 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SelectSeq(Tail(<<1>>), LAMBDA e : e > 0)), b |-> (((-1 % 0) = (2147483647 % 2147483647)) /\ [a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (~FALSE)])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05585 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
