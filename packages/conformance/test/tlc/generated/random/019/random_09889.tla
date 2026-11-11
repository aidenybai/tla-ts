(*---
description: Evaluates a random bool expression, seed 262, number 9889.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09889 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len(<<Len(<<3, 1, 2>>), IF TRUE THEN 3 ELSE -1>>) = LET b15373 == ([[x \in 1..2 |-> x] EXCEPT ![3] = 7])[Cardinality({})] IN Cardinality(DOMAIN [x \in 1..2 |-> x])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
