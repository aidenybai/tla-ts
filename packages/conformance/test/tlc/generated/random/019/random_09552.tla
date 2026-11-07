(*---
description: Evaluates a random int expression, seed 262, number 9552.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09552 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b14836 \in {b14837 \in ((2 .. -1) \ DOMAIN [x \in Nat |-> x + 1]) : ([[a |-> 1] EXCEPT !.a = @ + b14837] = (CHOOSE b14838 \in {} : FALSE))} : ((Cardinality(<<3, 1, 2>>) \in UNION {TRUE, Nat}) <=> ((CHOOSE r \in [a : {}] : TRUE) = [a |-> b14836, b |-> TRUE]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09552 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 281 of module random_09552
---*)
