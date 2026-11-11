(*---
description: Evaluates a random int expression, seed 262, number 8468.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08468 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Cardinality(<<1>>) + ([a |-> 1]).a) * Cardinality((2147483647 .. 0))) * Cardinality({{7, 2}, (-7)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08468 failed.
    2181:0 Attempted to compute cardinality of the value
    <<1>>
---*)
