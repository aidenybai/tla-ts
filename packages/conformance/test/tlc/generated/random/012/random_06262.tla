(*---
description: Evaluates a random int expression, seed 262, number 6262.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06262 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(<<((7 \div 2) \div Len(<<1, 2>>)), ((0 + 0) \div Head(<<1>>))>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
