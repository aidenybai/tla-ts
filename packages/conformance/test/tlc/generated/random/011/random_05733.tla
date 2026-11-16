(*---
description: Evaluates a random int expression, seed 262, number 5733.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05733 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(IF (\A b8826 \in {1} : FALSE) THEN (CHOOSE b8827 \in {x \in 1..3 : x > 1} : FALSE) ELSE Len(<<3, 1, 2>>) - ((CHOOSE b8828 \in 2..1 : TRUE) - Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05733 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 128 to line 14, col 155 of module random_05733
---*)
