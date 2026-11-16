(*---
description: Evaluates a random int expression, seed 262, number 1896.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01896 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([a |-> 7, b |-> TRUE]).a * (SubSeq(<<3, 1, 2>>, [x \in Nat |-> x + 1], 7) - (2 \div 2))) \div DOMAIN [[[x \in 1..2 |-> x] EXCEPT ![3] = -1] EXCEPT ![((1 :> 2) + 3)] = (2147483647 - -1)]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_01896 failed.
    2169:0 The second argument of SubSeq should be a natural number, but instead it is:
    [x \in Nat |-> <expression line 14, col 82 to line 14, col 86 of module random_01896>]
---*)
