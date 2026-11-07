(*---
description: Evaluates a random bool expression, seed 262, number 3880.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03880 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 0] = [[a |-> 1] EXCEPT !.a = @ + 0]) => (SubSeq(<<1>>, 2147483647, -1) < (3 - 7))) /\ [[[a |-> 3, b |-> TRUE] EXCEPT !.a = @ + Head(<<>>)] EXCEPT !.a = (([x \in 1..2 |-> x])[3] % (1 * 2147483647))]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Head to the empty sequence.
    2184:0 Attempted to apply Head to the empty sequence.
---*)
