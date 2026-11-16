(*---
description: Evaluates a random bool expression, seed 262, number 1510.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01510 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~([[a |-> 3, b |-> 7] EXCEPT !.a = IF TRUE THEN 7 ELSE 7] = [(CHOOSE b2408 \in FALSE : FALSE) EXCEPT !.a = (2 - 7)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01510 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 79 to line 14, col 108 of module random_01510
---*)
