(*---
description: Evaluates a random set expression, seed 262, number 5829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({Len((CHOOSE r \in [a : {1, 2}] : TRUE)), ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 3] EXCEPT !.a = CASE TRUE -> 2 [] OTHER -> 1]).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
    2283:0 The argument of Len should be a sequence, but instead it is:
    [a |-> 1]
---*)
