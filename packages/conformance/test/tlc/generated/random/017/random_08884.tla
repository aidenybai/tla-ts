(*---
description: Evaluates a random int expression, seed 262, number 8884.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08884 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(LET b13762 == IF TRUE THEN 7 ELSE -1 IN (b13762 - 2) - Head(<<-1, 7>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -6"
---*)
