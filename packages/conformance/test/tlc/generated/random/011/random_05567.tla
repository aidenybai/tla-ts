(*---
description: Evaluates a random set expression, seed 262, number 5567.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05567 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 % 1) .. ([a |-> 1, b |-> TRUE]).a) \cup DOMAIN (2147483647 :> 2147483647)) \ (UNION {[a |-> 1, b |-> TRUE], (2 .. 2)} \cap DOMAIN (CHOOSE f \in [{1, 2} -> {1, 2} \ {1}] : TRUE))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05567 failed.
    Attempted to compare the set {2} with the value:
    [a |-> 1, b |-> TRUE]
---*)
