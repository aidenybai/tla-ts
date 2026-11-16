(*---
description: Evaluates a random set expression, seed 262, number 9574.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09574 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((DOMAIN [[<<5, 6>> EXCEPT ![0] = [a |-> 1]] EXCEPT ![Head(<<3, 1, 2>>)] = (2 \div 3)] \ DOMAIN [b14864 \in UNION {{}, {1}} |-> Head(<<1>>)]))
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 26 to line 14, col 33 of module random_09574
    2144:3 The EXCEPT was applied to non-existing fields of the value at
    line 14, col 25 to line 14, col 58 of module random_09574
    | {2}
---*)
