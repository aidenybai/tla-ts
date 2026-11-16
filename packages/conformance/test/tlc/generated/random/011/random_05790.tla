(*---
description: Evaluates a random int expression, seed 262, number 5790.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05790 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> LET b8926 == 0 IN b8926, b |-> (TRUE /\ FALSE)] EXCEPT !.a = ((1 :> 2))[(CHOOSE b8927 \in {2, 1, 3} : TRUE)]]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2"
---*)
