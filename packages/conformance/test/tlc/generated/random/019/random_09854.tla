(*---
description: Evaluates a random seq expression, seed 262, number 9854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(SelectSeq(<<(3 \div 3), LET b15298 == 1 IN 2>>, LAMBDA e : e > 0)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2>>"
---*)
