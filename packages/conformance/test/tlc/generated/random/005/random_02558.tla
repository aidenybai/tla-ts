(*---
description: Evaluates a random bool expression, seed 262, number 2558.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02558 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = (7 - 2147483647)] EXCEPT !.a = (CASE TRUE -> 7 [] OTHER -> 3 \div LET b4033 == 2 IN 1)] = [[a |-> CASE TRUE -> 7 [] OTHER -> 2, b |-> [[a |-> 1] EXCEPT !.a = 2147483647]] EXCEPT !.a = @ + Head(([a |-> 1]).a)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    1
    2283:0 The argument of Head should be a sequence, but instead it is:
    1
---*)
