(*---
description: Evaluates a random bool expression, seed 262, number 6981.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06981 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[a |-> Head(<<1>>), b |-> ({1, 2} = {1})] EXCEPT !.a = @ + ([[a |-> 1] EXCEPT !.a = 0]).a] = (CHOOSE r \in [a : {1, 2}] : TRUE)))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
