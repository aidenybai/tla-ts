(*---
description: Evaluates a random int expression, seed 262, number 5559.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05559 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([b8609 \in [x \in Nat |-> x + 1] |-> 2])[LET b8610 == 2147483647 IN b8610]) - Cardinality([a |-> (0 * 7), b |-> (FALSE <=> TRUE)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05559 failed.
    Attempted to check if the value:
    2147483647
    is an element of the function [x \in Nat |-> <expression line 14, col 46 to line 14, col 50 of module random_05559>]
---*)
