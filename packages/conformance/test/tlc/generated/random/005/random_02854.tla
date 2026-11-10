(*---
description: Evaluates a random bool expression, seed 262, number 2854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b4525 == Len(Tail(<<1>>)) IN ((<<5, 6>>)[b4525])[([a |-> 1]).a] = Cardinality({CASE FALSE -> b4526 [] OTHER -> -1 : b4526 \in (1 .. 0)})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02854 failed.
    Attempted to access index 0 of tuple
    <<5, 6>>
    which is out of bounds.
---*)
