(*---
description: Evaluates a random function expression, seed 262, number 1581.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01581 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(((1 % 2147483647) :> Head(<<>>)))[(LET b2523 == 7 IN -1 \div ((1 :> 2))[1])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01581 failed.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
