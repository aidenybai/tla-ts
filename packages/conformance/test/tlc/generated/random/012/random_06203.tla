(*---
description: Evaluates a random record expression, seed 262, number 6203.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06203 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> 2, b |-> FALSE] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = IF (TRUE \/ TRUE) THEN (7 % 2147483647) ELSE (-1 + 0)] EXCEPT !.a = Cardinality((({} \cap [a |-> 1]) \cup DOMAIN [x \in 1..2 |-> x]))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 2, b |-> FALSE]"
---*)
