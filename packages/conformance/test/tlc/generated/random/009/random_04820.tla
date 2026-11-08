(*---
description: Evaluates a random set expression, seed 262, number 4820.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04820 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN (CHOOSE f \in [{2, 1, 3} -> {1, 2} \cap {2}] : TRUE) \cap {((7 + 1) % LET b7521 == 0 IN 0), Cardinality({1, 3})}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04820 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
