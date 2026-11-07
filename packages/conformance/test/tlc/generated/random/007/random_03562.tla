(*---
description: Evaluates a random int expression, seed 262, number 3562.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03562 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-(Cardinality(1..3) + (2147483647 + 2))) * (((1 - 2147483647) % (-1 % 0)) - ((CHOOSE f \in [1..2 -> {1, 2} \ {1}] : TRUE))[([a |-> 1]).a])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647+2
    2178:0 Overflow when computing 2147483647+2
---*)
