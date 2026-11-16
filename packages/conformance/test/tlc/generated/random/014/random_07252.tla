(*---
description: Evaluates a random record expression, seed 262, number 7252.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07252 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE ((~({x \in 1..3 : x > 1} \subseteq 1..3)) \/ ((CHOOSE r \in [a : {}] : TRUE) = <<<<3, 1, 2>>, 0>>)) -> (([a |-> [a |-> 1], b |-> TRUE])[Cardinality(2..1)] % Head((2 + 1))) [] OTHER -> (([[x \in 1..2 |-> x] EXCEPT ![7] = 3])[([a |-> 1, b |-> TRUE]).a] * (CASE TRUE -> 3 [] OTHER -> 2 + (2147483647 + 3))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07252 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 68 to line 14, col 95 of module random_07252
---*)
