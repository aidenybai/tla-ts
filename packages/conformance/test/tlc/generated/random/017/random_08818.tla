(*---
description: Evaluates a random int expression, seed 262, number 8818.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08818 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT ![1] = Cardinality(({x \in 1..3 : x > 1} \ {1}))], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08818 failed.
    Attempted to access record by a non-string argument: 1
---*)
