(*---
description: Evaluates a random int expression, seed 262, number 7897.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07897 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = CASE (FALSE <=> FALSE) -> (CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) [] OTHER -> [[a |-> 1] EXCEPT !.a = 1]]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2]"
---*)
