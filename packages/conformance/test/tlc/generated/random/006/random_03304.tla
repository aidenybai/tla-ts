(*---
description: Evaluates a random int expression, seed 262, number 3304.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03304 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head(Append(<<>>, 2147483647)) :> Len(Append(<<1>>, 7))))[Head(SortSeq(SortSeq(<<1>>, LAMBDA p, q : p < q), LAMBDA p, q : p < q))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03304 failed.
    Attempted to apply function:
    (2147483647 :> 2)
    to argument 1, which is not in the domain of the function.
---*)
