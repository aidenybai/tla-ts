(*---
description: Evaluates a random int expression, seed 262, number 361.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00361 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Cardinality(((1 * 0) .. Cardinality({x \in 1..3 : x > 1}))) + [[[a |-> 3, b |-> FALSE] EXCEPT !.a = @ + Head(<<1>>)] EXCEPT !.a = LET b594 == (0 % 0) IN CASE FALSE -> 2 [] OTHER -> b594]))
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
