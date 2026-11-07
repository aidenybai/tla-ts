(*---
description: Evaluates a random function expression, seed 262, number 370.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00370 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 3, b |-> FALSE] EXCEPT !.a = LET b608 == 2 IN 1]).a :> IF (CASE FALSE -> Nat [] OTHER -> -1 < (-1 % 0)) THEN (CHOOSE b609 \in DOMAIN <<5, 6>> : [[a |-> 1, b |-> TRUE] EXCEPT !.a = 2]) ELSE (([a |-> 1, b |-> TRUE]).a \div (2147483647 \div 3))))
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
