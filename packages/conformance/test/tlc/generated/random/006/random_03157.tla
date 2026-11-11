(*---
description: Evaluates a random int expression, seed 262, number 3157.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03157 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(\E b5033 \in DOMAIN (2147483647 :> 0) : (\A b5034 \in (SUBSET {1} \cup {1, 2}) : ([a |-> 1, b |-> TRUE] = [a |-> 1])))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_03157 failed.
    Attempted to compare the set {} with the value:
    2
---*)
