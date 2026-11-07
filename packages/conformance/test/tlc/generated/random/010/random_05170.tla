(*---
description: Evaluates a random int expression, seed 262, number 5170.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05170 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(Tail([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + (2147483647 % 2)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 2]
    2283:0 The argument of Tail should be a sequence, but instead it is:
    [a |-> 2]
---*)
