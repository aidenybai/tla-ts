(*---
description: Evaluates a random bool expression, seed 262, number 5372.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05372 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b8311 \in ((CHOOSE r \in [a : 2..1] : TRUE) \ ((1 - 2) .. (0 - 3))) : ([a |-> ([a |-> 1, b |-> TRUE] + b8311), b |-> (1 \in {1, 2})] = [a |-> (2 + -1), b |-> ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05372 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 32 to line 14, col 61 of module random_05372
---*)
