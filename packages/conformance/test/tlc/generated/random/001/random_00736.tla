(*---
description: Evaluates a random int expression, seed 262, number 736.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00736 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] = [a |-> 7, b |-> FALSE]), b |-> (\E b1207 \in UNION {2..1, {2, 1, 3}} : ([a |-> 1] = [a |-> 1, b |-> TRUE]))]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
