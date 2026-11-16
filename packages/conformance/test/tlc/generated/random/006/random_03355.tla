(*---
description: Evaluates a random bool expression, seed 262, number 3355.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03355 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1] EXCEPT !.a = @ + 2] EXCEPT !.a = (-1 - 2)] = [[a |-> -1, b |-> FALSE] EXCEPT !.a = IF TRUE THEN 2 ELSE 0]) /\ (\E b5330 \in (({1} \cap 2..1) \ (1 .. 0)) : ((\E b5331 \in {2, 1, 3} : TRUE) \/ (2 = 2147483647)))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
