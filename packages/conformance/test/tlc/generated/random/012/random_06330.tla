(*---
description: Evaluates a random bool expression, seed 262, number 6330.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06330 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b9728 \in (((3 \div 1) % (0 \div 7)) .. (CASE TRUE -> 1 [] OTHER -> -1 + (CHOOSE b9729 \in 2..1 : FALSE))) : (~DOMAIN (<<5, 6>> @@ [x \in Nat |-> x + 1]))))
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
