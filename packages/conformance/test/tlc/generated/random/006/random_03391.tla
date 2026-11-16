(*---
description: Evaluates a random seq expression, seed 262, number 3391.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03391 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SelectSeq(Tail(Tail(<<3, 1, 2>>)), LAMBDA e : e > 0), (-((0 \div 2) - (7 % 2)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 1>>"
---*)
