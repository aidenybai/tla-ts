(*---
description: Evaluates a random int expression, seed 262, number 5923.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05923 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(((3 \div 3) \div IF TRUE THEN 7 ELSE 3) + Len(<<7, 2>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
