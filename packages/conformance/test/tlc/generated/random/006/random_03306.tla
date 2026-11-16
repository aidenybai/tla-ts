(*---
description: Evaluates a random bool expression, seed 262, number 3306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((-0) = (CHOOSE b5257 \in 2..1 : FALSE)) /\ (~(~FALSE))) => ((([a |-> 1]).a .. Cardinality(TRUE)) \ ({7, 3} \ (1 .. 0)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03306 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 27 to line 14, col 55 of module random_03306
---*)
