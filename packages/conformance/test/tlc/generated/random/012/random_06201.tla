(*---
description: Evaluates a random bool expression, seed 262, number 6201.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06201 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [a |-> Head(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0)), b |-> ([a |-> 7, b |-> FALSE] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = 1])], b |-> (((0 % -1) .. ([x \in Nat |-> x + 1])[0]) \subseteq {(3 - 2), (0 + 7)})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06201 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    -1
---*)
