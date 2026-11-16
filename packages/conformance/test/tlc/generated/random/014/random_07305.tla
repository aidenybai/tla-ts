(*---
description: Evaluates a random record expression, seed 262, number 7305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> (-IF (-1 < 1) THEN (-0) ELSE (-7)), b |-> (~(UNION {{x \in 1..3 : x > 1}, {1, 2}} = {b11255 \in {1, 2} : TRUE}))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0, b |-> TRUE]"
---*)
