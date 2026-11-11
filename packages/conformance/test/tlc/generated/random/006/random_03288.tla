(*---
description: Evaluates a random record expression, seed 262, number 3288.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03288 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> Head([<<-1, 3>> EXCEPT ![1] = ([a |-> 1]).a]), b |-> ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE) = [(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a])])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> FALSE]"
---*)
