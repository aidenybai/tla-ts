(*---
description: Evaluates a random bool expression, seed 262, number 8893.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08893 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = (CHOOSE r \in [a : {1}] : TRUE)) /\ ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = (CHOOSE b13774 \in {1} : FALSE)] = (CHOOSE r \in [a : {}] : TRUE))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
