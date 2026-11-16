(*---
description: Evaluates a random seq expression, seed 262, number 7212.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07212 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(DOMAIN [[b11084 \in 1..3 |-> b11084] EXCEPT ![(\E b11085 \in 1 : TRUE)] = Len(<<1>>)], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07212 failed.
    TLC encountered a non-enumerable quantifier bound
    1.
    1
---*)
