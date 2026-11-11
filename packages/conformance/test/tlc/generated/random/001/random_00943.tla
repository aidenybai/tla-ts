(*---
description: Evaluates a random bool expression, seed 262, number 943.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00943 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] = [[a |-> 1] EXCEPT !.a = 7]) /\ DOMAIN {2, 3}) /\ (((0 % 7) = (3 + 2147483647)) <=> (\E b1518 \in UNION {FALSE, [a |-> 1, b |-> TRUE]} : ({1} \subseteq {})))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
