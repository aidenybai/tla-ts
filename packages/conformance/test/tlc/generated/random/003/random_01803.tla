(*---
description: Evaluates a random set expression, seed 262, number 1803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Cardinality(DOMAIN ((1 :> 2) @@ <<5, 6>>)) : b2854 \in {Head(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)), ((-1 :> -1))[LET b2855 == 2 IN 3]}})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01803 failed.
    Attempted to apply function:
    (-1 :> -1)
    to argument 3, which is not in the domain of the function.
---*)
