(*---
description: Evaluates a random bool expression, seed 262, number 9817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~(Head(Tail(<<1, 2>>)) < LET b15243 == (-1 + 2147483647) IN (7 * b15243))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 7*2147483646
    2178:0 Overflow when computing 7*2147483646
---*)
