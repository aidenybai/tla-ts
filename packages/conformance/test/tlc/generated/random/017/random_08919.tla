(*---
description: Evaluates a random seq expression, seed 262, number 8919.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08919 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(<<((2147483647 + 1) \div Len(<<1, 2>>)), Head(({1, 2} = {x \in 1..3 : x > 1}))>>, LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08919 failed.
    2178:0 Overflow when computing 2147483647+1
---*)
