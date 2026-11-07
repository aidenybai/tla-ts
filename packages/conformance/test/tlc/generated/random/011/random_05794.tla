(*---
description: Evaluates a random set expression, seed 262, number 5794.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05794 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({LET b8935 == Head(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q)) IN (Cardinality(1..3) + ([a |-> 1]).a), LET b8936 == Len(SortSeq(<<1, 2>>, LAMBDA p, q : p < q)) IN ((<<5, 6>>)[7] % Len(<<1, 2>>))})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05794 failed.
    Attempted to access index 7 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
