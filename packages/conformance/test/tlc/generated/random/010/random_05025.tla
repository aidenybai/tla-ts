(*---
description: Evaluates a random int expression, seed 262, number 5025.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05025 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) :> ((2 :> 7))[IF FALSE THEN -1 ELSE 7])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05025 failed.
    Attempted to apply function:
    (2 :> 7)
    to argument 7, which is not in the domain of the function.
---*)
