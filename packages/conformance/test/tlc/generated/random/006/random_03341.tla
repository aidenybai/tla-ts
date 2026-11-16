(*---
description: Evaluates a random int expression, seed 262, number 3341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(((TRUE \/ TRUE) - (0 % 0)) % ((-1 \div 3) - ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03341 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
