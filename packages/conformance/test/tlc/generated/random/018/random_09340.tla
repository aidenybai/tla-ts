(*---
description: Evaluates a random int expression, seed 262, number 9340.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09340 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(DOMAIN ((CHOOSE b14492 \in (2147483647 .. 2147483647) : ([a |-> 1] = [a |-> 1])) :> ((1 \div 0) * ([x \in 1..2 |-> x])[2])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2179:0 The second argument of \div is 0.
    2179:0 The second argument of \div is 0.
---*)
