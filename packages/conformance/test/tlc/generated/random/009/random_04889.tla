(*---
description: Evaluates a random int expression, seed 262, number 4889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b7609 == IF (0 \in {2, 1, 3}) THEN Head(<<1>>) ELSE (2 % TRUE) IN ({b7610 \in {1, 2} : FALSE} * (CHOOSE b7611 \in 2..1 : FALSE)) - Cardinality(((0 - 2) .. (2 \div 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04889 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 118 to line 14, col 146 of module random_04889
---*)
