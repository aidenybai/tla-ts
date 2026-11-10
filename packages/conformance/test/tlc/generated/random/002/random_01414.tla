(*---
description: Evaluates a random seq expression, seed 262, number 1414.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01414 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([SortSeq(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0), LAMBDA p, q : p < q) EXCEPT ![1] = (Cardinality(SUBSET {1}) % Cardinality(<<3, 1, 2>>))], LAMBDA e : e > 0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01414 failed.
    2181:0 Attempted to compute cardinality of the value
    <<3, 1, 2>>
---*)
