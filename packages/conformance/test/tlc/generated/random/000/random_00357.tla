(*---
description: Evaluates a random function expression, seed 262, number 357.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00357 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head([a |-> Cardinality({1}), b |-> (Nat \subseteq {})]) :> ((-(CHOOSE b586 \in 2..1 : FALSE)) % [[a |-> -1, b |-> TRUE] EXCEPT !.a = ((1 :> 2))[2]])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00357 failed.
    Attempted to evaluate an expression of form S \subseteq T, but S was not enumerable.
    line 14, col 54 to line 14, col 69 of module random_00357
---*)
