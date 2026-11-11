(*---
description: Evaluates a random bool expression, seed 262, number 3602.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03602 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + Cardinality(1..3)] EXCEPT ![1] = Cardinality(({1, 2} \cup 1..3))] = (CHOOSE f \in [{1, 2} \ {1} -> 2..1] : TRUE)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03602 failed.
    Attempted to access record by a non-string argument: 1
---*)
