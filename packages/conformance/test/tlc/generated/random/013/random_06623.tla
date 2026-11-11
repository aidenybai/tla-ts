(*---
description: Evaluates a random int expression, seed 262, number 6623.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06623 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(-(Cardinality({2, 1, 3}) \div ((1 :> 2))[3]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06623 failed.
    Attempted to apply function:
    <<2>>
    to argument 3, which is not in the domain of the function.
---*)
