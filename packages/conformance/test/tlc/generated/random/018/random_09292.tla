(*---
description: Evaluates a random bool expression, seed 262, number 9292.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09292 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((~((~(TRUE => FALSE)) \/ ([FALSE EXCEPT ![1] = 2147483647] = [[x \in Nat |-> x + 1] EXCEPT ![<<3, 1, 2>>] = <<1>>]))))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
