(*---
description: Evaluates a random function expression, seed 262, number 7508.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07508 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([Tail(<<1>>) EXCEPT ![1] = Len(<<1>>)]) :> ([b11565 \in {1, 7} |-> (<<5, 6>> \div b11565)])[(-Head(<<1>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 22 to line 14, col 32 of module random_07508
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07508 failed.
    In applying the function
    [b11565 \in {1, 7} |-> <expression line 14, col 89 to line 14, col 108 of module random_07508>],
    the first argument is:
    -1
    which is not in its domain.
---*)
