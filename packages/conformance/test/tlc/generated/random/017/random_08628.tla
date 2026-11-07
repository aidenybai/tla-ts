(*---
description: Evaluates a random set expression, seed 262, number 8628.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08628 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({((-(-1 - 7)) + ((2147483647 % 7) % Head(<<3, 1, 2>>))), ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = 2147483647] EXCEPT !.a = @ + (7 % 0)]).a})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
