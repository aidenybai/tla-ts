(*---
description: Evaluates a random record expression, seed 262, number 6352.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06352 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = (-2)] EXCEPT !.a = @ + CASE ({1} \subseteq 2..1) -> [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] [] OTHER -> (2147483647 * 0)] EXCEPT !.a = (Len((<<1, 2>> \o <<1>>)) \div IF (0 < 7) THEN ([x \in 1..2 |-> x])[2] ELSE (CHOOSE b9760 \in Nat : FALSE))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 1, b |-> TRUE]"
---*)
