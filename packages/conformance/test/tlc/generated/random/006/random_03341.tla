(*---
description: Evaluates a random int expression, seed 262, number 3341.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03341 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(((TRUE \/ TRUE) - (0 % 0)) % ((-1 \div 3) - ([a |-> 1, b |-> TRUE]).a))))
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
