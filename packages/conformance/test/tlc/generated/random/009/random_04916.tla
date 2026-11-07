(*---
description: Evaluates a random int expression, seed 262, number 4916.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04916 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \ {1} -> {1}] : TRUE))[(SubSeq(SortSeq(<<>>, LAMBDA p, q : p < q), (<<5, 6>>)[0], (2 \div 0)))[((-2) * ((1 :> 2))[2147483647])]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04916 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
