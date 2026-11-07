(*---
description: Evaluates a random bool expression, seed 262, number 4671.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04671 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b7305 \in UNION {{2, 1, 3}, {1}} : (1..3 = {1})) * Cardinality({b7306 \in {1} : FALSE})) < ((Len(<<1, 2>>) \div ([a |-> 1]).a) \div Cardinality((2 .. [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04671 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 72 of module random_04671
---*)
