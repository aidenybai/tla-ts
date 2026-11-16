(*---
description: Evaluates a random int expression, seed 262, number 1201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> (1 - 0), b |-> (FALSE => TRUE)] EXCEPT !.a = Len([<<3, 1, 2>> EXCEPT ![1] = 2])]).a)
====

(*--- recorded
all:
  exit: 0
  transcript: "| 3"
---*)
