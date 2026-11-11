(*---
description: Evaluates a random seq expression, seed 262, number 7505.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07505 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> CASE (3 \in [x \in Nat |-> x + 1]) -> ([a |-> 1]).a [] OTHER -> Cardinality(SUBSET {1}), b |-> ((-1 = 7) => (FALSE /\ TRUE))] \o Append(SortSeq(Tail(<<3, 1, 2>>), LAMBDA p, q : p < q), (([a |-> 1]).a - (1 + -1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07505 failed.
    Attempted to check if the value:
    3
    is an element of the function [x \in Nat |-> <expression line 14, col 51 to line 14, col 55 of module random_07505>]
---*)
