(*---
description: Evaluates a random bool expression, seed 262, number 3263.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03263 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SortSeq(SortSeq((<<>> \o <<1>>), LAMBDA p, q : p < q), LAMBDA p, q : p < q) = [b5194 \in {(-1 * 1) : b5195 \in ({x \in 1..3 : x > 1} \cup SUBSET {1})} |-> (Cardinality({1, 2}) * Head(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03263 failed.
    Attempted to compare the set {} with the value:
    3
---*)
