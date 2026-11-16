(*---
description: Evaluates a random int expression, seed 262, number 8479.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08479 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b13125 \in {b13126 \in ((2147483647 .. -1) \ (0 .. 2)) : ([a |-> b13126, b |-> FALSE] = [[a |-> 1] EXCEPT !.a = @ + b13126])} |-> ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
