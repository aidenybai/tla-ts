(*---
description: Evaluates a random set expression, seed 262, number 6411.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06411 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {UNION {({2, 1, 3} \cap {1}), UNION {TRUE, {2, 1, 3}}}, {Len(<<>>) : b9862 \in {SUBSET {1}, 1}}} \ (Cardinality({3 : b9863 \in {2, 1, 3}}) .. Len(<<2..1, 3>>))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06411 failed.
    Attempted to compare integer 1 with non-integer:
    {{}, {1}}
---*)
