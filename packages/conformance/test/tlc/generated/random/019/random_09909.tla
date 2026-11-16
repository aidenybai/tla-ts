(*---
description: Evaluates a random record expression, seed 262, number 9909.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09909 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (((3 + 7) * Head(<<3, 1, 2>>)) * ((-1 - 2) - IF FALSE THEN 3 ELSE 2))])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> -150]"
---*)
