(*---
description: Evaluates a random int expression, seed 262, number 8179.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08179 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(SelectSeq(SortSeq(<<3, 1, 2>>, LAMBDA p, q : p < q), LAMBDA e : e > 0)) * CASE (([x \in Nat |-> x + 1] \/ TRUE) => (<<1, 2>> = (1 :> 2))) -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 7]).a [] OTHER -> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08179 failed.
    Attempted to evaluate an expression of form P \/ Q when P was
    a function of the form  [x \in S |-> expr].
    line 14, col 103 to line 14, col 131 of module random_08179
---*)
