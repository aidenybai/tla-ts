(*---
description: Evaluates a random seq expression, seed 262, number 2371.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02371 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<Cardinality(({3, 2147483647} \cap {b3754 \in {1, 2} : TRUE})), ((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE))[(Tail(<<1>>) % (1 - 3))]>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02371 failed.
    Attempted to compute the value of an expression of form
    CHOOSE x \in S: P, but no element of S satisfied P.
    line 14, col 83 to line 14, col 125 of module random_02371
---*)
