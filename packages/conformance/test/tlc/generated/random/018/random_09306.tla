(*---
description: Evaluates a random int expression, seed 262, number 9306.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09306 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(({b14442 : b14442 \in {}} \cap DOMAIN [x \in Nat |-> x + 1])) \div (Head(Tail(<<1, 2>>)) \div Head(Append(<<1, 2>>, -1)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
