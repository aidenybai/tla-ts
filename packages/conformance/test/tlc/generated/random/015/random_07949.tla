(*---
description: Evaluates a random seq expression, seed 262, number 7949.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07949 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(-(-LET b12272 == <<5, 6>> IN 2)), (LET b12273 == Len(<<1>>) IN (3 + 0) * LET b12274 == Cardinality(2..1) IN (b12274 % b12274))>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07949 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
