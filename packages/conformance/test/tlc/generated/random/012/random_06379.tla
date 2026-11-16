(*---
description: Evaluates a random int expression, seed 262, number 6379.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06379 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality({((b9808 % 7) * Cardinality(TRUE)) : b9808 \in {(3 \div 0) : b9809 \in {7, 0}}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06379 failed.
    2179:0 The second argument of \div is 0.
---*)
