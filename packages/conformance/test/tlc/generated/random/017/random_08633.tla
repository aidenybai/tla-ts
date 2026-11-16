(*---
description: Evaluates a random function expression, seed 262, number 8633.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08633 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN [b13366 \in ((2 - -1) .. LET b13367 == 2 IN b13367) |-> (-LET b13368 == 2 IN 0)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
