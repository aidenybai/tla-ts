(*---
description: Evaluates a random record expression, seed 262, number 7130.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07130 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = (7 * 2147483647)] EXCEPT !.a = @ + (CASE TRUE -> 3 [] OTHER -> 1 - (7 - 3))] EXCEPT !.a = (((CHOOSE r \in [a : {2, 1, 3}] : TRUE) + (-2147483647)) \div ((CHOOSE r \in [a : {1, 2} \ {1}] : TRUE)).a)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 7*2147483647
    2178:0 Overflow when computing 7*2147483647
---*)
