(*---
description: Evaluates a random function expression, seed 262, number 6345.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06345 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(-(IF FALSE THEN [a |-> 1, b |-> TRUE] ELSE 0).a) : b9748 \in ((([a |-> 1]).a + (2 + 0)) .. CASE (~TRUE) -> IF FALSE THEN 7 ELSE 1 [] OTHER -> (-3))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
