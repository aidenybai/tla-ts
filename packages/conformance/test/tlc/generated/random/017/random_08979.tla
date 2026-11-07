(*---
description: Evaluates a random bool expression, seed 262, number 8979.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08979 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((CHOOSE b13938 \in {1} : TRUE) % (0 \div 3)) % LET b13939 == (7 + 2) IN ([a |-> 1]).a) < ((~({x \in 1..3 : x > 1} = {1, 2})) <=> ([a |-> 1, b |-> FALSE] = (CHOOSE r \in [a : {2, 1, 3}] : TRUE)))))
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
