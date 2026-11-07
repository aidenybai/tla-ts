(*---
description: Evaluates a random record expression, seed 262, number 5512.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05512 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1] EXCEPT !.a = (1 - 3)] EXCEPT !.a = ((0 % -1) * (-2147483647))] EXCEPT !.a = LET b8516 == (([a |-> 1]).a + ([a |-> 1]).a) IN CASE (TRUE \/ TRUE) -> Append(<<1>>, 2147483647) [] OTHER -> ([x \in 1..2 |-> x])[2147483647]])
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
