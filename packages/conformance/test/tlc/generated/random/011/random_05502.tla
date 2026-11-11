(*---
description: Evaluates a random int expression, seed 262, number 5502.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05502 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ((Len(<<>>) \in (-1 .. 0)) <=> (~(7 = 3))) THEN (([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a + ((-3) * Len(<<>>))) ELSE Head(<<(-1 * 7), (-1 - 0)>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -1"
---*)
