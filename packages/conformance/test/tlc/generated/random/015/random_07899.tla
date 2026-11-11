(*---
description: Evaluates a random bool expression, seed 262, number 7899.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07899 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> CASE FALSE -> 0 [] OTHER -> 7, b |-> (TRUE \/ TRUE)] = (CHOOSE r \in [a : 2..1] : TRUE)) /\ (~(\E b12191 \in UNION {{}, 2..1} : (~TRUE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07899 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 81 to line 14, col 110 of module random_07899
---*)
