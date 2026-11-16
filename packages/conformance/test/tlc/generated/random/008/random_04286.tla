(*---
description: Evaluates a random function expression, seed 262, number 4286.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04286 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((LET b6748 == Len(Append(<<>>, 2)) IN Cardinality((CHOOSE f \in [{} -> {1}] : TRUE)) :> Cardinality({(0 * 1), ([a |-> 1, b |-> TRUE]).a})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04286 failed.
    2181:0 Attempted to compute cardinality of the value
    <<>>
---*)
