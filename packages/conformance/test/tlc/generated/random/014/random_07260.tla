(*---
description: Evaluates a random bool expression, seed 262, number 7260.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07260 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((\E b11172 \in ({x \in 1..3 : x > 1} \cap {1}) : ([a |-> 1, b |-> TRUE] /\ TRUE)) \/ (([a |-> 1, b |-> TRUE] = [a |-> 1]) \/ (7 \in {1}))) /\ ((CHOOSE r \in [a : {1, 2}] : TRUE) = [(CHOOSE r \in [a : {}] : TRUE) EXCEPT !.a = @ + (-1)])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
