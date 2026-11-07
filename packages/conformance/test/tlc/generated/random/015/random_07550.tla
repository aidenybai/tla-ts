(*---
description: Evaluates a random bool expression, seed 262, number 7550.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07550 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((~([a |-> 2, b |-> FALSE] = [a |-> -1, b |-> TRUE])) \/ ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = [a |-> CASE TRUE -> 2 [] OTHER -> -1, b |-> (<<>> = [x \in 1..2 |-> x])])))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
