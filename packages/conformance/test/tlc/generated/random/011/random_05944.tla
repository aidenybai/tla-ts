(*---
description: Evaluates a random bool expression, seed 262, number 5944.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05944 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(<<LET b9161 == 3 IN b9161, Head(<<1, 2>>)>>, LAMBDA p, q : p < q) = [[a |-> Head(<<3, 1, 2>>), b |-> (FALSE => FALSE)] EXCEPT !.a = LET b9162 == Len(<<1>>) IN (b9162 % b9162)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05944 failed.
    Attempted to compare an integer with non-integer:
    "a".
---*)
