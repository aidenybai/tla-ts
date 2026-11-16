(*---
description: Evaluates a random bool expression, seed 262, number 5555.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05555 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((\E b8593 \in 2..1 : FALSE) \/ (\E b8594 \in 1..3 : TRUE)) \/ [a |-> LET b8595 == 7 IN b8595, b |-> (\E b8596 \in {2, 1, 3} : FALSE)]) <=> ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = @ + Cardinality(2..1)] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + (CHOOSE b8597 \in {x \in 1..3 : x > 1} : TRUE)])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
