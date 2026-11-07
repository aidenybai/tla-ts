(*---
description: Evaluates a random function expression, seed 262, number 6679.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06679 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = Len([a |-> 1])]).a < (CHOOSE r \in [a : {0} \cup {1}] : TRUE)))
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
