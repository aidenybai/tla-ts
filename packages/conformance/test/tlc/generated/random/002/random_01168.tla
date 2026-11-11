(*---
description: Evaluates a random bool expression, seed 262, number 1168.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01168 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> IF FALSE THEN 3 ELSE 0, b |-> (FALSE <=> FALSE)] EXCEPT !.a = @ + (IF TRUE THEN 2 ELSE 0 * (1 % [x \in Nat |-> x + 1]))] = [[[[a |-> 1] EXCEPT !.a = @ + 3] EXCEPT !.a = ([a |-> 1, b |-> TRUE]).a] EXCEPT !.a = ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1]).a]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
