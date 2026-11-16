(*---
description: Evaluates a random function expression, seed 262, number 9032.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09032 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Len([IF FALSE THEN 2147483647 ELSE 7 EXCEPT ![1] = <<[a |-> 1], 2>>]) :> (((-1 + -1) \div IF TRUE THEN 1 ELSE 2) * ((-1 :> 1))[Head(<<1, 2>>)])))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_09032 failed.
    Attempted to apply EXCEPT construct to the value 7.
---*)
