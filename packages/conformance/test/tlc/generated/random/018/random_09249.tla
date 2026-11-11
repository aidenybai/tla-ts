(*---
description: Evaluates a random bool expression, seed 262, number 9249.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09249 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(TRUE \/ FALSE)) => (LET b14359 == -1 IN b14359 < Head(<<1, 2>>))) /\ (Head(SubSeq(<<3, 1, 2>>, 1, 7)) = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09249 failed.
    2183:0 The third argument of SubSeq must be in the domain of its first argument:
    <<3, 1, 2>>
    , but instead it is
    7
---*)
