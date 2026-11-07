(*---
description: Evaluates a random bool expression, seed 262, number 9290.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09290 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((3 - 7) .. ([a |-> 1]).a) = {(0 % -1), Cardinality({x \in 1..3 : x > 1})}) <=> ({b14421 \in {2 : b14422 \in {1, 2}} : (FALSE <=> TRUE)} \subseteq Tail(Append(<<>>, 1)))))
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
