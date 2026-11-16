(*---
description: Evaluates a random int expression, seed 262, number 9803.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09803 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([a |-> (-1 + 7), b |-> (TRUE => TRUE)]).a :> ((LET b15209 == -1 IN 2147483647 - ([a |-> 1, b |-> TRUE]).a) \div Len(<<Nat, 2147483647>>))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (6 :> 1073741823)"
---*)
