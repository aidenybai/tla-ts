(*---
description: Evaluates a random bool expression, seed 262, number 5386.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05386 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(((2 % -1) % (2147483647 \div 2)) < Cardinality(({} \cap <<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05386 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
