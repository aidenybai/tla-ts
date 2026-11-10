(*---
description: Evaluates a random function expression, seed 262, number 7523.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07523 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b11592 \in {[[a |-> 7, b |-> FALSE] EXCEPT !.a = @ + IF FALSE THEN b11593 ELSE 1] : b11593 \in DOMAIN (CHOOSE f \in [{1, 2} \ {1} -> {0} \cup {1}] : TRUE)} |-> LET b11594 == (Cardinality({}) % (3 - b11592)) IN ([a |-> 3, b |-> [x \in Nat |-> x + 1]]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> 8, b |-> FALSE] :> 3)"
---*)
