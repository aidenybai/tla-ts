(*---
description: Evaluates a random bool expression, seed 262, number 8746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b13537 \in DOMAIN (LET b13538 == -1 IN b13538 :> (CHOOSE b13539 \in {2, 1, 3} : FALSE)) : ((<<b13537, b13537>> \o SortSeq(0, LAMBDA p, q : p < q)) = (IF TRUE THEN b13537 ELSE b13537 :> Cardinality({2, 1, 3})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08746 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 70 to line 14, col 104 of module random_08746
---*)
