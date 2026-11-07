(*---
description: Evaluates a random record expression, seed 262, number 4830.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04830 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (Head([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]) + ([[a |-> 1] EXCEPT !.a = @ + 2147483647]).a), b |-> (LET b7539 == Cardinality({1}) IN IF 7 THEN 0 ELSE b7539 = ((7 + 2147483647) - Len(<<3, 1, 2>>)))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 2, b |-> TRUE]
    2283:0 The argument of Head should be a sequence, but instead it is:
    [a |-> 2, b |-> TRUE]
---*)
