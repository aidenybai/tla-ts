(*---
description: Evaluates a random set expression, seed 262, number 5319.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05319 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {[(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0]).a], DOMAIN [((1 :> 2) @@ <<5, 6>>) EXCEPT ![Head(<<3, 1, 2>>)] = LET b8226 == TRUE IN b8226]})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05319 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 25 to line 14, col 54 of module random_05319
---*)
