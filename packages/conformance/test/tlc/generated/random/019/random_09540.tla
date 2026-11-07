(*---
description: Evaluates a random set expression, seed 262, number 9540.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09540 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({([{} EXCEPT !.a = b14826]).a : b14826 \in [a |-> (-1 % 0), b |-> (7 < 2)]} \cup {(Head(3) + IF TRUE THEN 3 ELSE 3), ((CHOOSE r \in [a : 2..1] : TRUE)).a}))
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
