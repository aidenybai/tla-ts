(*---
description: Evaluates a random bool expression, seed 262, number 5716.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05716 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((LET b8794 == 0 IN 3 % ([a |-> 1]).a) \in DOMAIN [[x \in Nat |-> x + 1] EXCEPT ![3] = 7]) /\ ((([a |-> 1, b |-> TRUE]).a \div (3 * 1)) \in (LET b8795 == 0 IN 2 .. Head(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
