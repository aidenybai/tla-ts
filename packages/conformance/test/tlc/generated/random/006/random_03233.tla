(*---
description: Evaluates a random int expression, seed 262, number 3233.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03233 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-Cardinality((({x \in 1..3 : x > 1} \ 1..3) \cup DOMAIN [x \in Nat |-> x + 1]))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03233 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
