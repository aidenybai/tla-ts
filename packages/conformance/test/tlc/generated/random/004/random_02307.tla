(*---
description: Evaluates a random function expression, seed 262, number 2307.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02307 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-([[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 1]).a) :> (Tail(SubSeq(<<3, 1, 2>>, 3, -1))).a))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2184:0 Attempted to apply Tail to the empty sequence.
    2184:0 Attempted to apply Tail to the empty sequence.
---*)
