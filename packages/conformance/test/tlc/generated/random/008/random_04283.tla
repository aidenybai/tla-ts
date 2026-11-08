(*---
description: Evaluates a random bool expression, seed 262, number 4283.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04283 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(SortSeq([<<1, 2>> EXCEPT ![1] = [a |-> 1]], LAMBDA p, q : p < q)) = IF ((CHOOSE b6743 \in 2..1 : {1, 2}) < Len(<<>>)) THEN LET b6744 == ([a |-> 1, b |-> TRUE]).a IN (7 - 7) ELSE (-([a |-> 1]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04283 failed.
    2266:0 The second argument of < should be an integer, but instead it is:
    [a |-> 1]
---*)
