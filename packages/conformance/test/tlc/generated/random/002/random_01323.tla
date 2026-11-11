(*---
description: Evaluates a random function expression, seed 262, number 1323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [1..2 -> 1..2] : TRUE) EXCEPT ![(((CHOOSE b2109 \in <<>> : TRUE) - ([x \in 1..2 |-> x])[-1]) + ((CHOOSE r \in [a : 1..2] : TRUE) \div (CHOOSE b2110 \in 1..3 : TRUE)))] = (((CHOOSE b2111 \in {1} : [a |-> 1, b |-> TRUE]) - SelectSeq(<<1, 2>>, LAMBDA e : e > 0)) + (LET b2112 == 3 IN 3 - (0 - 7)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01323 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 66 to line 14, col 93 of module random_01323
---*)
