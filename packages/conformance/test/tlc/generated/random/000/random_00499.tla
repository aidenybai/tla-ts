(*---
description: Evaluates a random seq expression, seed 262, number 499.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00499 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq(SubSeq(SelectSeq([<<1, 2>> EXCEPT ![1] = 0], LAMBDA e : e > 0), IF (<<1>> = [a |-> 1, b |-> TRUE]) THEN (-1 \div 2) ELSE (2 \div 7), ([<<3, 1, 2>> EXCEPT ![2] = 1])[Tail(<<1>>)]), LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00499 failed.
    Attempted to access tuple at a non integral index: <<>>
---*)
