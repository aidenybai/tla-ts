(*---
description: Evaluates a random bool expression, seed 262, number 5048.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05048 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> ([a |-> 1, b |-> TRUE]).a, b |-> (\E b7850 \in {x \in 1..3 : x > 1} : TRUE)] EXCEPT !.a = @ + (Len(<<1>>) - ([a |-> 1]).a)] = [[[[a |-> 1] EXCEPT !.a = @ + 1] EXCEPT !.a = @ + Len(<<3, 1, 2>>)] EXCEPT !.a = DOMAIN [a |-> 2, b |-> <<1, 2>>]]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
