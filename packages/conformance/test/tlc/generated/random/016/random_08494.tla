(*---
description: Evaluates a random int expression, seed 262, number 8494.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08494 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b13150 == Head(<<(-1 % 1), (7 % -1)>>) IN Len([SelectSeq(<<1>>, LAMBDA e : e > 0) EXCEPT ![1] = (b13150 - b13150)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08494 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
