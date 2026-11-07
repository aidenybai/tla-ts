(*---
description: Evaluates a random bool expression, seed 262, number 3988.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03988 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((([[a |-> 0, b |-> <<>>] EXCEPT !.a = Head(<<>>)]).a = (-(([x \in 1..2 |-> x])[2] * (-1)))))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
