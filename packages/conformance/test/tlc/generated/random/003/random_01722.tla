(*---
description: Evaluates a random int expression, seed 262, number 1722.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01722 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((CHOOSE b2739 \in {2, 1, 3} : FALSE) - Cardinality({1}))) * Head(Append(([a |-> 1] @@ [x \in 1..2 |-> x]), Head(<<>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01722 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 21 to line 14, col 54 of module random_01722
---*)
