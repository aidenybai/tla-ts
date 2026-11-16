(*---
description: Evaluates a random function expression, seed 262, number 6420.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06420 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Len(([(<<1, 2>> \o [a |-> 1]) EXCEPT ![1] = (0 - 2)] \o SortSeq(Tail(<<1, 2>>), LAMBDA p, q : p < q))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module random_06420 failed.
    2182:0 Evaluating an expression of the form t \o s when s is not a sequence:
    [a |-> 1]
---*)
