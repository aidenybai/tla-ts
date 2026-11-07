(*---
description: Evaluates a random record expression, seed 262, number 5533.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05533 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = @ + Head(<<1, 2>>)] EXCEPT !.a = @ + ((2 - 0) % (-1))] EXCEPT !.a = @ + ([a |-> (-1 \div 2147483647), b |-> (\E b8561 \in {} : {1})]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
