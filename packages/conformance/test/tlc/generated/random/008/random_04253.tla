(*---
description: Evaluates a random int expression, seed 262, number 4253.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04253 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF (([a |-> 1, b |-> TRUE] = [a |-> 1]) => (~TRUE)) THEN LET b6687 == ([a |-> 1, b |-> TRUE]).a IN (-b6687) ELSE LET b6688 == Len(<<>>) IN (3 \div b6688) - (Head(<<2, 2>>) * (Cardinality(TRUE) + IF FALSE THEN 0 ELSE -1))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
