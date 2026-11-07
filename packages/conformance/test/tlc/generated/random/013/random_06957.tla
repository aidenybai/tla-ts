(*---
description: Evaluates a random function expression, seed 262, number 6957.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06957 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b10642 \in {b10643 \in UNION {({x \in 1..3 : x > 1} \cap {2, 1, 3}), (SUBSET {1} \cap Nat)} : (DOMAIN [x \in 1..2 |-> x] = ({1, 2} \cap SUBSET {1}))} |-> (-((b10642 + 1) * LET b10644 == b10642 IN b10642))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {}
    is an element of Nat.
---*)
