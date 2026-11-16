(*---
description: Evaluates a random int expression, seed 262, number 8269.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08269 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({b12803 : b12803 \in {1}} \cap {<<5, 6>>, 2147483647})) % Len(SortSeq(Tail(<<>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08269 failed.
    Attempted to check equality of the function <<5, 6>> with the value:
    1
---*)
