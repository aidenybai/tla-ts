(*---
description: Evaluates a random bool expression, seed 262, number 3424.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03424 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : 1..2] : TRUE) EXCEPT !.a = @ + (CHOOSE b5431 \in (-1 % 1) : (1 < b5431))] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03424 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 69 to line 14, col 107 of module random_03424
---*)
