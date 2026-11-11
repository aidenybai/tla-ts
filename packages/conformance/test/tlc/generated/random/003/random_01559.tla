(*---
description: Evaluates a random record expression, seed 262, number 1559.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01559 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b2489 \in (2 .. 3) : (\A b2490 \in {2, 1, 3} : TRUE)), b |-> (([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) <=> ([a |-> 1, b |-> TRUE] = [a |-> 1]))] EXCEPT !.a = (-CASE ([a |-> 1, b |-> TRUE] = [a |-> 1, b |-> TRUE]) -> ([a |-> 1]).a [] OTHER -> (2147483647 \div 1))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -1, b |-> FALSE]"
---*)
