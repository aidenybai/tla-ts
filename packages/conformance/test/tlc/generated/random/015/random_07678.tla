(*---
description: Evaluates a random set expression, seed 262, number 7678.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07678 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(Head((2147483647 \div 1)) + (-(-1 * 3))), IF ((<<>> \div 7) \in ((1 :> 2) @@ [x \in 1..2 |-> x])) THEN (-(1 - 2)) ELSE Head([<<1, 2>> EXCEPT ![1] = -1])})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2283:0 The argument of Head should be a sequence, but instead it is:
    2147483647
    2283:0 The argument of Head should be a sequence, but instead it is:
    2147483647
---*)
