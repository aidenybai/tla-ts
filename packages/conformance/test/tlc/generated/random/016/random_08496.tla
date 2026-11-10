(*---
description: Evaluates a random bool expression, seed 262, number 8496.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08496 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : 2..1] : TRUE) EXCEPT !.a = ((2147483647 % 1) \div ([a |-> 1]).a)] = [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = ((CHOOSE b13153 \in {x \in 1..3 : x > 1} : TRUE) % (3 - 0))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08496 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_08496
---*)
