(*---
description: Evaluates a random function expression, seed 262, number 1342.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01342 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = Len(<<1>>)]).a :> LET b2144 == ((2 - 3) + (-1 - 3)) IN ((b2144 + 0) - (CHOOSE b2145 \in 2..1 : FALSE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01342 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 142 to line 14, col 170 of module random_01342
---*)
