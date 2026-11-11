(*---
description: Evaluates a random set expression, seed 262, number 6374.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06374 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b9798 \in {(([a |-> 1, b |-> TRUE]).a + (7 \div 1)), ((2147483647 :> 3))[(2147483647 * 1)]} : (Len((<<1, 2>> \o <<>>)) = ((-1 % 7) + (-b9798)))})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
