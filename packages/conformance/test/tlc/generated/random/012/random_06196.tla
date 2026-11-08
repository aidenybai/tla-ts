(*---
description: Evaluates a random function expression, seed 262, number 6196.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06196 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(Tail((-2147483647))) :> (Len(Tail(<<>>)) - ((-0) + Cardinality(SUBSET {1})))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06196 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    -2147483647
---*)
