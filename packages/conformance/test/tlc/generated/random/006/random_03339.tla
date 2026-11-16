(*---
description: Evaluates a random record expression, seed 262, number 3339.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03339 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1, 2} \ {1}] : TRUE) EXCEPT !.a = LET b5309 == (([a |-> 1] = [a |-> 1, b |-> TRUE]) + (-1 \div 2)) IN IF (<<1, 2>> = (1 :> 2)) THEN (3 * b5309) ELSE IF FALSE THEN 1 ELSE 0])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
