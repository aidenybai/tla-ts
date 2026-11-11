(*---
description: Evaluates a random set expression, seed 262, number 5156.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05156 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [[b8005 \in UNION {{1, 2}, {2, 1, 3}} |-> (-b8005)] EXCEPT ![(CHOOSE b8006 \in {3, 2147483647} : (\A b8007 \in {2, 1, 3} : TRUE))] = CASE (1 < 1) -> (2 + 0) [] OTHER -> CASE TRUE -> 7 [] OTHER -> -1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2, 3}"
---*)
