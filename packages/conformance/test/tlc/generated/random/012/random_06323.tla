(*---
description: Evaluates a random int expression, seed 262, number 6323.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06323 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality({1, 2}) + ([a |-> 1, b |-> TRUE]).a) .. (Cardinality({1, 2}) * Cardinality(1..3))) % (-((CHOOSE b9719 \in 0 : TRUE) - Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06323 failed.
    Attempted to compute the value of an expression of
    form CHOOSE x \in S: P, but S was not enumerable.
    line 14, col 120 to line 14, col 144 of module random_06323
---*)
