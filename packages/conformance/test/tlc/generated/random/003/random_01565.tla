(*---
description: Evaluates a random int expression, seed 262, number 1565.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01565 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len([SortSeq(<<<<1, 2>>, 3>>, LAMBDA p, q : p < q) EXCEPT ![1] = ([[a |-> 1] EXCEPT !.a = @ + [x \in 1..2 |-> x]]).a]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of < should be an integer, but instead it is:
    <<1, 2>>
    2266:0 The second argument of < should be an integer, but instead it is:
    <<1, 2>>
---*)
