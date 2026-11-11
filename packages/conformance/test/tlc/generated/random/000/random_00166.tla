(*---
description: Evaluates a random function expression, seed 262, number 166.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00166 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b261 \in ({b262 \in ({2, 1, 3} \ {2, 1, 3}) : (b262 \in Nat)} \cup ((SUBSET {1} \cap {}) \ (7 .. 1))) |-> ([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + (b261 * 2)]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<>>"
---*)
