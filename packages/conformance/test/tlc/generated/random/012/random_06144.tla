(*---
description: Evaluates a random record expression, seed 262, number 6144.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06144 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = (-2)] EXCEPT !.a = @ + Len(SelectSeq(<<1>>, LAMBDA e : e > 0))] EXCEPT !.a = @ + ([[a |-> 7, b |-> FALSE] EXCEPT !.a = ([a |-> 1]).a]).a])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [a |-> 0]"
---*)
