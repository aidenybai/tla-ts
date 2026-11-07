(*---
description: Evaluates a random int expression, seed 262, number 8461.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08461 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([b13092 \in Nat |-> b13092])[[a |-> 7, b |-> FALSE]]) - (([b13093 \in {} |-> 2147483647])[Len(<<1, 2>>)] + ((7 \div 2) - (-3)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> 7, b |-> FALSE]
    is an element of Nat.
    2158:0 Attempted to check if the value:
    [a |-> 7, b |-> FALSE]
    is an element of Nat.
---*)
