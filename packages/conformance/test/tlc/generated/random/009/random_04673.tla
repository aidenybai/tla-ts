(*---
description: Evaluates a random record expression, seed 262, number 4673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (7 \div 7), b |-> ([a |-> 1] = [a |-> 1, b |-> TRUE])] EXCEPT !.a = @ + CASE (FALSE /\ TRUE) -> IF TRUE THEN 3 ELSE 2147483647 [] OTHER -> (-7)] EXCEPT !.a = (IF (TRUE <=> TRUE) THEN (0 - 7) ELSE CASE FALSE -> 1 [] OTHER -> 2 \div ((0 \div 2) :> ([x \in Nat |-> x + 1] \div 0)))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -7, b |-> FALSE]"
---*)
