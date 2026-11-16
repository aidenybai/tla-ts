(*---
description: Evaluates a random int expression, seed 262, number 8999.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08999 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([a |-> 1]).a :> LET b13977 == 2147483647 IN 0))[Head(Tail(<<3, 1, 2>>))] % (LET b13978 == ([a |-> 1, b |-> TRUE]).a IN (b13978 + 7) + (LET b13979 == 2147483647 IN -1 \div IF FALSE THEN 3 ELSE 3))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
