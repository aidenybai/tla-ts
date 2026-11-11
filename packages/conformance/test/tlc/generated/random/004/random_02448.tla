(*---
description: Evaluates a random bool expression, seed 262, number 2448.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02448 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> LET b3861 == 0 IN 2, b |-> ({2, 1, 3} = {1, 2})]).a = (((-7) :> Len(<<>>)))[Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02448 failed.
    Attempted to apply function:
    (-7 :> 0)
    to argument 1, which is not in the domain of the function.
---*)
