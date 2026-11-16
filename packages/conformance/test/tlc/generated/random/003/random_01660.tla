(*---
description: Evaluates a random bool expression, seed 262, number 1660.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01660 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 0, b |-> TRUE] EXCEPT !.a = (CHOOSE b2649 \in {2, 1, 3} : FALSE)]).a \in {((0 % 1) \div Len(<<1, 2>>)) : b2650 \in {(CHOOSE b2651 \in 2..1 : TRUE), Head(<<>>)}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01660 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 55 to line 14, col 88 of module random_01660
---*)
