(*---
description: Evaluates a random set expression, seed 262, number 9287.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09287 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((([a |-> 1, b |-> TRUE]).a - IF FALSE THEN -1 ELSE -1) :> ([a |-> -1, b |-> TRUE]).a))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
