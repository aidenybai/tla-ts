(*---
description: Evaluates a random int expression, seed 262, number 7891.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07891 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(Append(Tail(<<>>), Head(<<1, 2>>))) * ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = (3 + -1)]).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
