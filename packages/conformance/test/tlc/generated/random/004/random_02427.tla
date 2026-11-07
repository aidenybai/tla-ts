(*---
description: Evaluates a random record expression, seed 262, number 2427.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02427 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(<<(UNION {1..3, 2..1} < (-7)), IF (FALSE => FALSE) THEN Head(<<1>>) ELSE ([x \in Nat |-> x + 1]).a>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The first argument of < should be an integer, but instead it is:
    {1, 2, 3}
    2266:0 The first argument of < should be an integer, but instead it is:
    {1, 2, 3}
---*)
