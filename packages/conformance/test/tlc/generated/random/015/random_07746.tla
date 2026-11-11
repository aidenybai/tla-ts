(*---
description: Evaluates a random int expression, seed 262, number 7746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1, b |-> TRUE]).a \div (7 % 3)) * (-Len(<<1>>))) + (CHOOSE b11950 \in {(7 + 7), (7 * 3)} : (DOMAIN (1 :> 2) \subseteq {2, b11950}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07746 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 79 to line 14, col 156 of module random_07746
---*)
