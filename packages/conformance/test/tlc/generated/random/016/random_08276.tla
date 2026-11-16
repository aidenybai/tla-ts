(*---
description: Evaluates a random int expression, seed 262, number 8276.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08276 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE b12818 \in (2 .. 2) : (TRUE /\ TRUE)) * (CHOOSE b12819 \in ({1} \cap {x \in 1..3 : x > 1}) : (b12819 = b12819))) - Cardinality({Len(<<>>), (2147483647 + [a |-> 1, b |-> TRUE])})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08276 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 67 to line 14, col 135 of module random_08276
---*)
