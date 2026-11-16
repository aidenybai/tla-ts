(*---
description: Evaluates a random int expression, seed 262, number 3918.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03918 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Cardinality(({Len(<<3, 1, 2>>) : b6182 \in (2147483647 .. 2147483647)} \cap {Head(<<1, 2>>), LET b6183 == 2147483647 IN 7})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
