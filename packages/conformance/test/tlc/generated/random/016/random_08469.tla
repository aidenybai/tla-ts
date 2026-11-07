(*---
description: Evaluates a random bool expression, seed 262, number 8469.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08469 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [b13101 \in DOMAIN [x \in 1..2 |-> x] |-> (b13101 % 0)] \subseteq (((<<1, 2>> \o <<>>) \cap (1..3 \cap {})) \cup (DOMAIN [x \in Nat |-> x + 1] .. ({1})[2]))))
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
