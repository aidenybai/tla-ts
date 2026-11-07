(*---
description: Evaluates a random int expression, seed 262, number 9432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(((SubSeq(<<1, 2>>, 3, 1) \o Append(<<3, 1, 2>>, 1)) \o ((1 - 2147483647) % (2147483647 % 1)))))
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
