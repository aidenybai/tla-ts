(*---
description: Evaluates a random int expression, seed 262, number 7155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b11000 == Cardinality(UNION {{7, 2147483647}, {<<>> : b11001 \in {2, 1, 3}}}) IN (IF (1..3 = {}) THEN (b11000 - [a |-> 1]) ELSE (CHOOSE b11002 \in 2..1 : TRUE) \div IF (SUBSET {1} \ SUBSET {1}) THEN Head(<<>>) ELSE ({1, 2} + 2)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07155 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 149 to line 14, col 177 of module random_07155
---*)
