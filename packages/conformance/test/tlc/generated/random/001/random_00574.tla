(*---
description: Evaluates a random set expression, seed 262, number 574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(((7 % 2) % (0 * 2147483647)) \div ((CHOOSE r \in [a : {1}] : TRUE) + (7 + 2))), ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
