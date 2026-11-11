(*---
description: Evaluates a random seq expression, seed 262, number 394.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00394 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<(Cardinality((0 % 0)) * ([[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]).a), (Head(<<1, -1>>) % ((CHOOSE r \in [a : 2..1] : TRUE)).a)>>)
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_00394 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
