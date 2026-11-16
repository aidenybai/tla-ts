(*---
description: Evaluates a random function expression, seed 262, number 673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1123 \in ({LET b1124 == 7 IN 2, IF FALSE THEN -1 ELSE 3} \cup (({2, 1, 3} \cap {2, 1, 3}) \ ({x \in 1..3 : x > 1} \cap Nat))) |-> (CHOOSE b1125 \in {b1126 \in {2147483647, 7} : (FALSE => FALSE)} : (~(SUBSET {1} = 2..1)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<7, 7, 7>>"
---*)
