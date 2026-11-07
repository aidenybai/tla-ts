(*---
description: Evaluates a random int expression, seed 262, number 7597.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07597 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-IF ((0 .. 2) \subseteq (2147483647 - -1)) THEN Cardinality(Len(<<1, 2>>)) ELSE (-Cardinality({}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 2147483647--1
    2178:0 Overflow when computing 2147483647--1
---*)
