(*---
description: Evaluates a random bool expression, seed 262, number 1752.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01752 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head((Tail(<<1, 2>>) \o [<<>> EXCEPT ![1] = 2147483647])) < ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = @ + (-1 * 7)]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 42 to line 14, col 45 of module random_01752
    | FALSE
---*)
