(*---
description: Evaluates a random bool expression, seed 262, number 2084.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02084 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b3319 \in {(-Head(<<>>)) : b3320 \in {b3321 \in ({1, 2} \cup {1}) : (b3321 \in SUBSET {1})}} : (IF (1 \in {2, 1, 3}) THEN Len(<<1>>) ELSE (b3319 \div 2) < Len(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02084 failed.
    Attempted to check if the non-enumerable value
    1
    is element of
    {{}, {1}}
---*)
