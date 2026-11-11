(*---
description: Evaluates a random int expression, seed 262, number 6753.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06753 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b10351 == IF ((2 = 3) => (TRUE /\ TRUE)) THEN ([[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]).a ELSE (([a |-> 1]).a + (CHOOSE b10352 \in 2147483647 : FALSE)) IN (-Len(<<<<3, 1, 2>>, b10351>>)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2"
---*)
