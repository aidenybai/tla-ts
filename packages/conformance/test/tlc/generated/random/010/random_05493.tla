(*---
description: Evaluates a random seq expression, seed 262, number 5493.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05493 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 + 0) \div (CHOOSE b8493 \in 2..1 : FALSE)) \div Len(Tail(<<1>>))) % CASE (([a |-> 1]).a < Len(<<1, 2>>)) -> ([[a |-> 1] EXCEPT !.a = 2147483647])[LET b8494 == 7 IN b8494] [] OTHER -> (CHOOSE b8495 \in UNION {1, {x \in 1..3 : x > 1}} : ([a |-> 1] = 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05493 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 61 of module random_05493
---*)
