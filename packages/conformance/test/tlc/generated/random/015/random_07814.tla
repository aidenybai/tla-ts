(*---
description: Evaluates a random seq expression, seed 262, number 7814.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07814 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([(SortSeq(<<1, 2>>, LAMBDA p, q : p < q) \o [{1} EXCEPT ![1] = 0]) EXCEPT ![1] = (LET b12059 == -1 IN b12059 % LET b12060 == -1 IN 1)], LAMBDA p, q : p < q))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07814 failed.
    Attempted to apply EXCEPT construct to the value {1}.
---*)
