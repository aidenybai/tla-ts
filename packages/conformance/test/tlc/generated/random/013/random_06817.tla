(*---
description: Evaluates a random record expression, seed 262, number 6817.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06817 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> LET b10449 == IF (\A b10450 \in {} : TRUE) THEN (2147483647 \div 7) ELSE Head(<<3, 1, 2>>) IN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b10449]).a, b |-> (((FALSE <=> TRUE) <=> (TRUE \/ FALSE)) /\ ((\E b10451 \in {2, 1, 3} : FALSE) <=> (2 /\ FALSE)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 306783379, b |-> FALSE]"
---*)
