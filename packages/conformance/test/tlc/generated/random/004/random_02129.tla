(*---
description: Evaluates a random record expression, seed 262, number 2129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2}] : TRUE) EXCEPT !.a = (CASE ([a |-> 1] \subseteq {2, 1, 3}) -> (-1) [] OTHER -> LET b3376 == 2 IN b3376 + (CHOOSE b3377 \in {3 : b3378 \in {2, 1, 3}} : (\E b3379 \in 1..3 : TRUE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02129 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 72 to line 14, col 100 of module random_02129
---*)
