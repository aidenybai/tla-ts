(*---
description: Evaluates a random bool expression, seed 262, number 5981.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05981 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Tail((SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q) \o <<2147483647, 0>>)) = ((CHOOSE b9215 \in {2, 1} : (TRUE => FALSE)) :> Cardinality({-1 : b9216 \in {2, 1, 3}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05981 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 92 to line 14, col 132 of module random_05981
---*)
