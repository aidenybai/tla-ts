(*---
description: Evaluates a random seq expression, seed 262, number 153.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00153 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<IF ((\A b236 \in SUBSET {1} : FALSE) => (2147483647 < 2)) THEN Len(Append(<<>>, -1)) ELSE ((-0) \div (-1 \div 3)), Len(Tail(<<3, 2147483647>>))>>)
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 1>>"
---*)
