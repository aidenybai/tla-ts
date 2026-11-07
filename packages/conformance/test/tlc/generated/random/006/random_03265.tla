(*---
description: Evaluates a random set expression, seed 262, number 3265.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03265 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1, 2} -> {0} \cup {1}] : TRUE) EXCEPT ![1] = ((Cardinality({2, 1, 3}) \div (2147483647 - -1)) + (CHOOSE r \in [a : {1, 2}] : TRUE))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647--1
    2178:0 Overflow when computing 2147483647--1
---*)
