(*---
description: Evaluates a random seq expression, seed 262, number 8626.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08626 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(<<IF (1..3 = {2, 1, 3}) THEN (2 \div 2) ELSE LET b13360 == 2147483647 IN 7, Cardinality({-1, 2})>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
