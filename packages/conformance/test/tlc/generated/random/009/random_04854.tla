(*---
description: Evaluates a random int expression, seed 262, number 4854.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04854 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((2 % 2147483647) + Len(<<3, 1, 2>>))) * Len(SelectSeq([<<1, 2>> EXCEPT ![1] = 2147483647], LAMBDA e : e > 0))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -10"
---*)
