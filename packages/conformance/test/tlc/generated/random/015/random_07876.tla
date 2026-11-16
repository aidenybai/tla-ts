(*---
description: Evaluates a random bool expression, seed 262, number 7876.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07876 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b12160 \in (3 .. 1) : (FALSE \/ FALSE)) % (CASE FALSE -> 7 [] OTHER -> -1 * (-[a |-> 1, b |-> TRUE]))) = ([LET b12161 == -1 IN b12161 EXCEPT !.a = (CHOOSE b12162 \in <<1>> : FALSE)] + ((-2147483647) * Cardinality({1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07876 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 63 of module random_07876
---*)
