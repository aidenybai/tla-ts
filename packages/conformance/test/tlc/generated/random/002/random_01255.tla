(*---
description: Evaluates a random bool expression, seed 262, number 1255.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01255 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((2 .. 1) \cap (1 .. 7)) = ({-1, 7} \cup ({x \in 1..3 : x > 1} \cup {1, 2}))) <=> ((([a |-> 1, b |-> TRUE] \in 2..1) \/ (0 \in 1..3)) => (DOMAIN [x \in Nat |-> x + 1] = {7, -1}))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
