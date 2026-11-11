(*---
description: Evaluates a random bool expression, seed 262, number 1166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~([[a |-> 1, b |-> TRUE] EXCEPT !.a = (CHOOSE b1866 \in 1 : FALSE)] = (CHOOSE r \in [a : 1..2] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01166 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 56 to line 14, col 81 of module random_01166
---*)
