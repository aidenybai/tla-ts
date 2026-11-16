(*---
description: Evaluates a random record expression, seed 262, number 4662.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04662 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE r \in [a : {2, 1, 3}] : TRUE) EXCEPT !.a = ([b7285 \in ({x \in 1..3 : x > 1} \cap 2147483647) |-> CASE TRUE -> b7285 [] OTHER -> 2])[((-1 + 2147483647) - (3 + 2147483647))]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_04662 failed.
    Attempted to check if the value:
    2
    is an element of the integer 2147483647
---*)
