(*---
description: Evaluates a random seq expression, seed 262, number 8670.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08670 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(Append(Cardinality(DOMAIN <<5, 6>>), ((-1 @@ [x \in 1..2 |-> x]))[(1 - 0)]), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08670 failed.
    2169:0 The first argument of @@ should be a function, but instead it is:
    -1
---*)
