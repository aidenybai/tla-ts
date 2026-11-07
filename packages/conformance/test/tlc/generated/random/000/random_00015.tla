(*---
description: Evaluates a random record expression, seed 262, number 15.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00015 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (-7), b |-> ({1} = {1})] EXCEPT !.a = @ + ((2 \div 3) % LET b18 == 7 IN 0)] EXCEPT !.a = CASE (({} = {x \in 1..3 : x > 1}) <=> (FALSE => TRUE)) -> LET b19 == (2147483647 + 7) IN IF TRUE THEN b19 ELSE 2147483647 [] OTHER -> IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (3 % -1) ELSE (<<1>> % 0)])
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
