(*---
description: Evaluates a random int expression, seed 262, number 8536.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08536 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({([a |-> 1]).a : b13228 \in DOMAIN [x \in 1..2 |-> x]}) % Cardinality((({1, 2} \ {1, 2}) \cap (1..3 \ 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
