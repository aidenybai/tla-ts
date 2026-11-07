(*---
description: Evaluates a random bool expression, seed 262, number 7415.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07415 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((Head((<<1, 2>> \o <<1, 2>>)) * ((2 - 3) % (2 * 0))) < (((2147483647 + 3) + Cardinality({1})) * ([b11426 \in {1, 2} |-> b11426] @@ [[x \in 1..2 |-> x] EXCEPT ![0] = 2]))))
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
