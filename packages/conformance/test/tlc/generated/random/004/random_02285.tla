(*---
description: Evaluates a random bool expression, seed 262, number 2285.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02285 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((([x \in 1..2 |-> x])[1] % (0 + 2147483647)) = CASE (\A b3601 \in {1, 2} : TRUE) -> (-0) [] OTHER -> CASE TRUE -> -1 [] OTHER -> 7) /\ (Len((<<3, 1, 2>> \o <<1, 2>>)) < ((0 \div 2147483647) % (7 % 2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
