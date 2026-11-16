(*---
description: Evaluates a random set expression, seed 262, number 7918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((({b12221 : b12221 \in {2, 1, 3}} \ UNION {Nat, {x \in 1..3 : x > 1}}) \cap ((Nat \cup 1..3) \ {b12222 \in [a |-> 1, b |-> TRUE] : FALSE})) \ DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_07918 failed.
    Attempted to compare the set {2, 3} with the value:
    Nat
---*)
