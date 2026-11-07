(*---
description: Evaluates a random bool expression, seed 262, number 6276.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06276 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a < (((2 + 2147483647) + LET b9657 == 2147483647 IN 2147483647) - ([a |-> [a |-> 1, b |-> TRUE], b |-> 3]).a)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2+2147483647
    2178:0 Overflow when computing 2+2147483647
---*)
