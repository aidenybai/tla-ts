(*---
description: Evaluates a random bool expression, seed 262, number 4311.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04311 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b6796 \in (([[a |-> 1] EXCEPT !.a = 0]).a \cap (DOMAIN [x \in 1..2 |-> x] \ DOMAIN [x \in 1..2 |-> x])) : ((~(FALSE \/ FALSE)) /\ (Head(<<1, 2>>) < ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
