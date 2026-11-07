(*---
description: Evaluates a random int expression, seed 262, number 8292.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08292 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((-(7 + 1)) % (Cardinality(SUBSET {1}) % (0 - 2147483647))) % (((CHOOSE f \in [{} -> {1}] : TRUE))[(1 * 1)] - ((-1) + (3 \div FALSE)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2147483647
    2169:0 The second argument of % should be a positive number, but instead it is:
    -2147483647
---*)
