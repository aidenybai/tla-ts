(*---
description: Evaluates a random int expression, seed 262, number 5097.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality((({b7928 \in {} : FALSE} \cup ({2, 1, 3} \cup 1..3)) \cap ([<<1, 2>> EXCEPT ![1] = 2147483647] \cup ({} \cap 1..3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_05097 failed.
    Attempted to check set membership in a tuple value.
---*)
