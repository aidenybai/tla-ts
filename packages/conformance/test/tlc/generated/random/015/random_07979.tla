(*---
description: Evaluates a random bool expression, seed 262, number 7979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([((2147483647 :> 0) @@ ((1 :> 2) @@ [x \in 1..2 |-> x])) EXCEPT ![(CHOOSE b12324 \in DOMAIN [x \in Nat |-> x + 1] : (b12324 = 2147483647))] = (({2, 1, 3}).a - (0 + 0))] <=> ((~(1 < 3)) \/ ((7 < 2) \/ ((1 :> 2) /\ TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07979 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 84 to line 14, col 153 of module random_07979
---*)
