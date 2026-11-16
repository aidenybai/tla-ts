(*---
description: Evaluates a random bool expression, seed 262, number 4218.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04218 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a < ((Cardinality(1..3) % ([a |-> 1]).a) + (-Len(<<1, 2>>)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
