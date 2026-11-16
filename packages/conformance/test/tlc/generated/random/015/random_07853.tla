(*---
description: Evaluates a random set expression, seed 262, number 7853.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07853 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 1] EXCEPT !.a = @ + IF FALSE THEN 2 ELSE -1]).a, Cardinality(DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![0] = 2])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07853 failed.
    2181:0 Attempted to compute cardinality of the value
    Nat
---*)
