(*---
description: Evaluates a random bool expression, seed 262, number 9471.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09471 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((~(0 = 0)) /\ ((TRUE /\ TRUE) => ([a |-> 1, b |-> TRUE] = [a |-> 1]))) => ((CHOOSE r \in [a : {0} \cup {1}] : TRUE) = [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2147483647] EXCEPT !.a = LET b14719 == 0 IN b14719])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
