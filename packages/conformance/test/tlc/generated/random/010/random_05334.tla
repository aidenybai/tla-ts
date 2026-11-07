(*---
description: Evaluates a random seq expression, seed 262, number 5334.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05334 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Tail(({CASE FALSE -> b8247 [] OTHER -> b8247 : b8247 \in DOMAIN (1 :> 2)} \cup ({b8248 : b8248 \in 2..1} \cup UNION {{x \in 1..3 : x > 1}, {2, 1, 3}}))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1, 2, 3}
    2283:0 The argument of Tail should be a sequence, but instead it is:
    {1, 2, 3}
---*)
