(*---
description: Evaluates a random bool expression, seed 262, number 9201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Len([<<>> EXCEPT ![1] = 2]) < ((<<5, 6>>)[2147483647] \div Cardinality({1, 2})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 24 to line 14, col 27 of module random_09201
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09201 failed.
    Attempted to access index 2147483647 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
