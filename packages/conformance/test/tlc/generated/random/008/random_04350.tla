(*---
description: Evaluates a random seq expression, seed 262, number 4350.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04350 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([<<IF (\E b6852 \in {1} : FALSE) THEN (1 % 0) ELSE Len(<<1, 2>>), (CHOOSE b6853 \in (Nat \cap {2, 1, 3}) : (TRUE \/ FALSE))>> EXCEPT ![1] = LET b6854 == ([[x \in Nat |-> x + 1] EXCEPT ![2147483647] = 2147483647])[(-1 - 2)] IN {b6855 \in ({1, 2} \ Nat) : ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE])}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{}, 1>>"
---*)
