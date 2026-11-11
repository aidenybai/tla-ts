(*---
description: Evaluates a random bool expression, seed 262, number 1164.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01164 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1}] : TRUE) = (CHOOSE r \in [a : 2..1] : TRUE)) /\ ((-[a |-> 7, b |-> FALSE]) \in ((SUBSET {1} .. 2) \ ({x \in 1..3 : x > 1} \cup {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01164 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 53 to line 14, col 82 of module random_01164
---*)
