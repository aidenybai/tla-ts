(*---
description: Evaluates a random seq expression, seed 262, number 2224.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02224 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq(((<<TRUE, -1>> \o [<<>> EXCEPT ![1] = 2]) \o Append(SelectSeq(<<1>>, LAMBDA e : e > 0), Head(2..1))), LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 45 to line 14, col 48 of module random_02224
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02224 failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {}
---*)
