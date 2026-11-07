(*---
description: Evaluates a random record expression, seed 262, number 1535.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01535 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + LET b2440 == [a |-> (CHOOSE b2441 \in {2, 1, 3} : FALSE), b |-> (1 \in Nat)] IN ((-b2440) - ([x \in Nat |-> x + 1])[2])])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01535 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 93 to line 14, col 126 of module random_01535
---*)
