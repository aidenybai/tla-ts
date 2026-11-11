(*---
description: Evaluates a random bool expression, seed 262, number 3176.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03176 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~(([x \in 1..2 |-> x] @@ (1 :> 2)) < (CHOOSE r \in [a : 2..1] : TRUE))) => [a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a, b |-> ((-1 - 2147483647) < ([x \in 1..2 |-> x])[2])]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03176 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 56 to line 14, col 85 of module random_03176
---*)
