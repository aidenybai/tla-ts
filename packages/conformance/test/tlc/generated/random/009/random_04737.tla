(*---
description: Evaluates a random int expression, seed 262, number 4737.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04737 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality({b7404 \in ({1, 2} \cap {}) : (<<3, 1, 2>> = (1 :> 2))}) \div (Head([<<1, 2>> EXCEPT ![1] = 2147483647]) \div (CASE TRUE -> 3 [] OTHER -> [a |-> 1] + CASE TRUE -> 3 [] OTHER -> -1))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
