(*---
description: Evaluates a random int expression, seed 262, number 755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-(IF (FALSE /\ TRUE) THEN (2147483647 + 3) ELSE LET b1238 == 2147483647 IN 2 \div Head((<<1, 2>> \o <<3, 1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
