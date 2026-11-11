(*---
description: Evaluates a random record expression, seed 262, number 4274.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04274 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ((2147483647 - 3) % CASE TRUE -> 2147483647 [] OTHER -> 1), b |-> ((TRUE \/ TRUE) \/ (\E b6730 \in (1 :> 2) : TRUE))] EXCEPT !.a = @ + ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 0] EXCEPT !.a = Cardinality({2, 1, 3})]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2147483647, b |-> TRUE]"
---*)
