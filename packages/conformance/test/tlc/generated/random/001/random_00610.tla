(*---
description: Evaluates a random int expression, seed 262, number 610.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00610 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b1024 == ((-(0 % 2)) \div (([a |-> 1, b |-> TRUE]).a * (7 % 3))) IN ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + b1024] EXCEPT !.a = Cardinality({})]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 0"
---*)
