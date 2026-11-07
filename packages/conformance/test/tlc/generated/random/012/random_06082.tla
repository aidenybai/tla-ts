(*---
description: Evaluates a random set expression, seed 262, number 6082.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06082 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(IF (FALSE /\ TRUE) THEN Head(<<3, 1, 2>>) ELSE (-7) + ((-1 % -1) * Len(<<>>))), ((CASE TRUE -> 7 [] OTHER -> 7 :> ([x \in Nat |-> x + 1] @@ (1 :> 2))) @@ [[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + -1] EXCEPT !.a = ([x \in 1..2 |-> x] + [a |-> 1])])})
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
