(*---
description: Evaluates a random record expression, seed 262, number 5793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> ([[x \in 1..2 |-> x] EXCEPT ![1] = 1])[(7 + 2147483647)], b |-> ((0 \div 0) = (<<1, 2>> % -1))] EXCEPT !.a = @ + Len((-IF TRUE THEN 1 ELSE -1))])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2178:0 Overflow when computing 7+2147483647
    2178:0 Overflow when computing 7+2147483647
---*)
