(*---
description: Evaluates a random int expression, seed 262, number 2158.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02158 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-Len(SelectSeq(<<3, 1, 2>>, LAMBDA e : e > 0))) % ([[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = (0 % 7)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_02158 failed.
    2169:0 The second argument of % should be a positive number, but instead it is:
    0
---*)
