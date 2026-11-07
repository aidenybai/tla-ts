(*---
description: Evaluates a random int expression, seed 262, number 2691.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02691 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((LET b4259 == ([a |-> 1, b |-> TRUE]).a IN ([x \in 1..2 |-> x])[b4259] - (Cardinality({}) % (-1 % 0))) * (({2147483647 : b4260 \in {2, 1, 3}} \ (2 .. 3)) - (CHOOSE b4261 \in {b4262 : b4262 \in {1, 2}} : Len(<<1, 2>>)))))
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
