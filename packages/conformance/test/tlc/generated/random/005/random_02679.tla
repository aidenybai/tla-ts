(*---
description: Evaluates a random bool expression, seed 262, number 2679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : 2..1] : TRUE) = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = ([x \in Nat |-> x + 1] \div 2147483647)]) \/ {CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> (<<5, 6>>)[7] [] OTHER -> ([a |-> 1]).a, Head(Tail(<<3, 1, 2>>))}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02679 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 19 to line 14, col 48 of module random_02679
---*)
