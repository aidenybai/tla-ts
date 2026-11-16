(*---
description: Evaluates a random bool expression, seed 262, number 2457.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02457 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((SelectSeq(Tail((3 % 2)), LAMBDA e : e > 0) = [[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + TRUE] EXCEPT !.a = @ + (7 + 2147483647)] EXCEPT !.a = @ + Cardinality({7, 7})]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02457 failed.
    2283:0 The argument of Tail should be a sequence, but instead it is:
    1
---*)
