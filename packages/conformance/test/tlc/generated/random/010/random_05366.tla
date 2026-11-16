(*---
description: Evaluates a random int expression, seed 262, number 5366.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05366 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b8299 \in (3 .. 2) : (FALSE \/ TRUE)) - (-Head(<<3, 1, 2>>))) - (([b8300 \in {1, 2} |-> b8300])[(1 + 2)] + ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05366 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 61 of module random_05366
---*)
