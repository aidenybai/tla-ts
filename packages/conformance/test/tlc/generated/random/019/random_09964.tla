(*---
description: Evaluates a random record expression, seed 262, number 9964.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09964 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> ((Cardinality(SUBSET {1}) \in (FALSE <=> TRUE)) => (([a |-> 1]).a < (2 * 1))), b |-> ((CHOOSE f \in [1..2 -> {1}] : TRUE) < Cardinality(({x \in 1..3 : x > 1} \cup 2..1)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09964 failed.
    Attempted to check if the value:
    2
    is an element of the boolean FALSE
---*)
