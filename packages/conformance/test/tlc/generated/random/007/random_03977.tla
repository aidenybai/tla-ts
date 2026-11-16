(*---
description: Evaluates a random bool expression, seed 262, number 3977.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03977 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (-3), b |-> (~TRUE)] = [(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + LET b6252 == 1 IN 2]) \/ ((({x \in 1..3 : x > 1} \ 2..1) \subseteq (7 .. 1)) /\ (Append(<<1, 2>>, 2) = ((1 :> 2) @@ [x \in Nat |-> x + 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03977 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 50 to line 14, col 77 of module random_03977
---*)
