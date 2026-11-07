(*---
description: Evaluates a random bool expression, seed 262, number 1746.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01746 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<Head(Tail(<<3, 1, 2>>)), ((0 - 3) + LET b2772 == 1 IN b2772)>> = [b2773 \in (({1, 2} \cap {x \in 1..3 : x > 1}) \ ({x \in 1..3 : x > 1} \ SUBSET {1})) |-> (IF <<>> THEN b2773 ELSE b2773 * (1 - 7))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01746 failed.
    Attempted to check if the non-enumerable value
    2
    is element of
    {{}, {1}}
---*)
