(*---
description: Evaluates a random int expression, seed 262, number 3643.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03643 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} -> {1}] : TRUE))[((-LET b5759 == 7 IN 2) * (-(2147483647 \div 0)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
