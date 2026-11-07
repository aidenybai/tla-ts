(*---
description: Evaluates a random bool expression, seed 262, number 3375.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03375 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((0 % 1) \div Head(<<1, 2>>)) .. IF (FALSE \/ FALSE) THEN (-1 + 0) ELSE Head(2)) = (CASE (7 = 0) -> ([a |-> 1, b |-> TRUE] * 7) [] OTHER -> (2147483647 % 1) .. Cardinality((FALSE .. 1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    2
    2283:0 The argument of Head should be a sequence, but instead it is:
    2
---*)
