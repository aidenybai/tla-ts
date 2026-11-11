(*---
description: Evaluates a random record expression, seed 262, number 4363.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04363 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([DOMAIN (-(CHOOSE b6877 \in [x \in 1..2 |-> x] : FALSE)) EXCEPT !.a = @ + (-(CHOOSE b6878 \in {2 : b6879 \in {2, 1, 3}} : (\A b6880 \in {1, 2} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04363 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 27 to line 14, col 69 of module random_04363
---*)
