(*---
description: Evaluates a random bool expression, seed 262, number 6877.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06877 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a) < ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2] EXCEPT !.a = LET b10545 == 2 IN b10545]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
