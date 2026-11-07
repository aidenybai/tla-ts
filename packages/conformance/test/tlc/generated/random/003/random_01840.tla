(*---
description: Evaluates a random set expression, seed 262, number 1840.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01840 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN Tail(<<(7 \div 0), LET b2911 == 2 IN 7>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
