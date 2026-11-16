(*---
description: Evaluates a random int expression, seed 262, number 5715.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05715 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b8792 == (Head(SortSeq(<<1>>, LAMBDA p, q : p < q)) * (Len([a |-> 1]) + Head(<<3, 1, 2>>))) IN (([b8793 \in {} |-> b8793])[IF FALSE THEN b8792 ELSE 0] + Head(SubSeq(<<3, 1, 2>>, b8792, -1))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05715 failed.
    In applying the function
    <<>>,
    the first argument is:
    0
    which is not in its domain.
---*)
