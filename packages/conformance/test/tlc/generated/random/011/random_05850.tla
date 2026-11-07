(*---
description: Evaluates a random record expression, seed 262, number 5850.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05850 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (((3 - 0) + (1 - 7)) \in UNION {UNION {{x \in 1..3 : x > 1}, {2, 1, 3}}, {b9025 \in {1} : FALSE}}), b |-> ((({1, 2} \cap {x \in 1..3 : x > 1}) < (2 + -1)) <=> (<<1, 7>> = (\E b9026 \in {2, 1, 3} : FALSE)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    {2}
    2266:0 The first argument of < should be an integer, but instead it is:
    {2}
---*)
