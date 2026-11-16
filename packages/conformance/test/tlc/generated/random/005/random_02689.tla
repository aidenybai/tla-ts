(*---
description: Evaluates a random function expression, seed 262, number 2689.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02689 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((CASE FALSE -> 1 [] OTHER -> 0 + Cardinality({1})) :> CASE (<<1>> = [x \in Nat |-> x + 1]) -> (CHOOSE b4256 \in {} : TRUE) [] OTHER -> ([x \in 1..2 |-> x])[1]) EXCEPT ![CASE (([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ (TRUE => [a |-> 1])) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 1]).a [] OTHER -> Len([FALSE EXCEPT ![1] = 2])] = LET b4257 == Cardinality(UNION {Nat, {}}) IN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 7]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02689 failed.
    To convert a function of form [x \in S |-> f(x)] to a tuple, the set S must be enumerable.
---*)
