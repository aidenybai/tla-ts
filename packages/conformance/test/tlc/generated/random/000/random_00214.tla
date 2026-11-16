(*---
description: Evaluates a random int expression, seed 262, number 214.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00214 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b347 == IF ([[a |-> 1] EXCEPT !.a = 0] = [a |-> 2147483647, b |-> TRUE]) THEN ((<<1>> % 7) % (3 \div 2)) ELSE LET b348 == ([a |-> 1, b |-> TRUE] = [a |-> 1]) IN [[a |-> 1] EXCEPT !.a = [a |-> 1]] IN ([[[a |-> 1] EXCEPT !.a = @ + 0] EXCEPT !.a = Cardinality({})]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
