(*---
description: Evaluates a random bool expression, seed 262, number 1929.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01929 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((\A b3032 \in {(-1) : b3033 \in ({1} \ TRUE)} : ([a |-> 2, b |-> FALSE] = (-1 - b3032))) /\ ((({1} = {x \in 1..3 : x > 1}) \/ (<<3, 1, 2>> = [x \in 1..2 |-> x])) <=> ((3 - 7) < (3 * 3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01929 failed.
    Attempted to check if the value:
    1
    is an element of the boolean TRUE
---*)
