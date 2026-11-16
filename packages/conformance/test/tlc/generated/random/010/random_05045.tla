(*---
description: Evaluates a random bool expression, seed 262, number 5045.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05045 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7841 \in [[a |-> 1] EXCEPT !.a = -1] : (0 \in {x \in 1..3 : x > 1})) * ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a) = Head(<<((1 :> 2))[2147483647], Cardinality(1..3)>>)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05045 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 19 to line 14, col 93 of module random_05045
---*)
