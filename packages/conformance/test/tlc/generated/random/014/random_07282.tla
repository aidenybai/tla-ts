(*---
description: Evaluates a random record expression, seed 262, number 7282.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07282 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({(CHOOSE b11215 \in DOMAIN [x \in Nat |-> x + 1] : (TRUE \/ TRUE)), (([a |-> 1]).a - (7 - 1))} = {((1 % b11216) - Cardinality({1, 2})) : b11216 \in {(CHOOSE r \in [a : {2, 1, 3}] : TRUE), ([x \in Nat |-> x + 1])[3]}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07282 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 19 to line 14, col 81 of module random_07282
---*)
