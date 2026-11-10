(*---
description: Evaluates a random function expression, seed 262, number 6266.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06266 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((IF ((<<1>> \o <<>>) = (-1 :> 1)) THEN ((-1) - Len(<<>>)) ELSE Len([<<1>> EXCEPT ![1] = FALSE]) :> LET b9650 == ([[a |-> 1] EXCEPT !.a = @ + -1]).a IN {Head(<<3, 1, 2>>), Len(<<3, 1, 2>>)}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<{3}>>"
---*)
