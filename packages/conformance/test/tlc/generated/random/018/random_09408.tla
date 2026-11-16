(*---
description: Evaluates a random set expression, seed 262, number 9408.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09408 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[(<<5, 6>> @@ (1 :> 2)) EXCEPT ![(2 \div 3)] = (-1 \div 7)] EXCEPT ![([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a] = (CHOOSE b14594 \in {-1 : b14595 \in 1..3} : (TRUE <=> FALSE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 45 of module random_09408
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09408 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 140 to line 14, col 198 of module random_09408
---*)
