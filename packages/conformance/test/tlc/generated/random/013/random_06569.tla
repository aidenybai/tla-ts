(*---
description: Evaluates a random record expression, seed 262, number 6569.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06569 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[a |-> (7 * 2), b |-> (1 < 2)] EXCEPT !.a = ([[x \in Nat |-> x + 1] EXCEPT ![[a |-> 1]] = <<5, 6>>])[(-1 \div 7)]] EXCEPT !.a = @ + ([(CHOOSE r \in [a : {1}] : TRUE) EXCEPT !.a = @ + Len(<<1>>)]).a])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Nat.
    2158:0 Attempted to check if the value:
    [a |-> 1]
    is an element of Nat.
---*)
