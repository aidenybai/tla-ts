(*---
description: Evaluates a random int expression, seed 262, number 1196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CHOOSE b1923 \in (((0 + 1) \div LET b1924 == 2 IN b1924) .. (-Len(<<3, 1, 2>>))) : (((<<3, 1, 2>> = [x \in Nat |-> x + 1]) => (FALSE \/ TRUE)) => ((-1 < b1923) /\ ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01196 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 17 to line 14, col 228 of module random_01196
---*)
