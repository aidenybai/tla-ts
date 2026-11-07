(*---
description: Evaluates a random function expression, seed 262, number 8432.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08432 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (0 % -1), b |-> (FALSE \/ FALSE)] EXCEPT !.a = @ + ((2147483647)[2147483647] * (-1 - 3))] EXCEPT !.a = ((IF 1 THEN 2147483647 ELSE 3 % (2 + 2)) - IF (\A b13052 \in 2..1 : TRUE) THEN (2147483647 % 1) ELSE ([x \in Nat |-> x + 1])[-1])])
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
