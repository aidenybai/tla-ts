(*---
description: Evaluates a random function expression, seed 262, number 8645.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08645 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Cardinality(DOMAIN [x \in Nat |-> x + 1]) \div ([b13381 \in Nat |-> b13381])[(3 + 2147483647)]) :> ((CHOOSE r \in [a : 1..2] : TRUE)).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_08645 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
