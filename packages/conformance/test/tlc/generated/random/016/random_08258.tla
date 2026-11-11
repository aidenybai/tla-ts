(*---
description: Evaluates a random int expression, seed 262, number 8258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b12784 == ((CHOOSE b12785 \in 1..3 : FALSE) % (0 :> 7)) IN (((1 :> 2))[b12784] * CASE TRUE -> b12784 [] OTHER -> 7) - ((CHOOSE b12786 \in UNION {{x \in 1..3 : x > 1}, {1}} : ([a |-> 1] = [a |-> 1, b |-> TRUE])) \div ((2 - 2) - (-2)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08258 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 33 to line 14, col 62 of module random_08258
---*)
