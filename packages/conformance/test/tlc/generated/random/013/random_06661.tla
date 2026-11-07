(*---
description: Evaluates a random record expression, seed 262, number 6661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Len(SubSeq(Append(<<3, 1, 2>>, 0), {1, 2147483647}, SelectSeq(<<1, 2>>, LAMBDA e : e > 0))), b |-> (Len(<<7, 2147483647>>) < (IF FALSE THEN -1 ELSE 1 - ([a |-> 1]).a))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {1, 2147483647}
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    {1, 2147483647}
---*)
